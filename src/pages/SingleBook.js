import BlockContent from "@sanity/block-content-to-react";
import React from "react";
import { Container } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import Loader from "../components/Loader";
import serializers from "../components/serializers";
import { fetcher } from "../utils/fetcher";

const SingleBook = () => {
  const { slug } = useParams();

  const query = `*[_type== 'book' && slug.current == '${slug}']{
      title,
      slug,
      publishedYear,
      latestEditionYear,
      pages,
      isbn,
      edition,
      volume,
      cover{
        asset->{
          _id,
          url
        }
      },
      "authors": authors[]->{ _id, name, slug },
      "categories": categories[]->{ _id, title },
      tableOfContents,
      summary,
      pdfLinks,
      audioLinks
    }[0]`;

  const { data: book } = useSWR(query, fetcher);

  if (!book) return <Loader />;

  const coverUrl = book?.cover?.asset?.url;
  const authors = book?.authors?.filter(Boolean) || [];
  const categories = book?.categories?.filter(Boolean) || [];
  const volumeNumber = book?.volume?.volumeNumber;
  const originalWork = book?.volume?.originalWork;

  const pdfLinks = (book?.pdfLinks || []).filter((link) => link?.url);
  const audioLinks = (book?.audioLinks || []).filter((link) => link?.url);
  const hasMediaActions = pdfLinks.length > 0 || audioLinks.length > 0;

  const metaRows = [];
  if (book.publishedYear)
    metaRows.push({ label: "First published", value: `${book.publishedYear}` });
  if (book.latestEditionYear)
    metaRows.push({
      label: "Latest edition",
      value: `${book.latestEditionYear}`,
    });
  if (book.edition) metaRows.push({ label: "Edition", value: book.edition });
  if (volumeNumber) metaRows.push({ label: "Volume", value: volumeNumber });
  if (book.pages) metaRows.push({ label: "Pages", value: `${book.pages}` });
  if (book.isbn) metaRows.push({ label: "ISBN", value: book.isbn });

  return (
    <Container>
      <div className="book-detail">
        <h1 className="mb-4">
          <span className="curly-brace">{`{ `}</span>
          {book.title}
          <span className="curly-brace">{` }`}</span>
        </h1>

        <div className="book-detail-head d-md-flex">
          <div
            className="book-detail-cover"
            style={
              coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined
            }
          >
            {!coverUrl && (
              <span className="book-cover-fallback">{book.title}</span>
            )}
          </div>

          <div className="book-detail-meta">
            {authors.length > 0 && (
              <p className="book-detail-authors">
                By{" "}
                {authors.map((author, index) => (
                  <React.Fragment key={author._id || index}>
                    {author.slug ? (
                      <Link to={`/library/author/${author.slug.current}`}>
                        {author.name}
                      </Link>
                    ) : (
                      author.name
                    )}
                    {index < authors.length - 1 ? ", " : ""}
                  </React.Fragment>
                ))}
              </p>
            )}

            {categories.length > 0 && (
              <ul className="book-chips list-inline">
                {categories.map((cat) => (
                  <li key={cat._id} className="book-chip">
                    {cat.title}
                  </li>
                ))}
              </ul>
            )}

            {metaRows.length > 0 && (
              <dl className="book-detail-specs">
                {metaRows.map((row) => (
                  <div className="spec-row" key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {originalWork && (
              <p className="book-detail-series">
                Part of: <strong>{originalWork}</strong>
              </p>
            )}

            {hasMediaActions && (
              <div className="book-read-actions">
                {pdfLinks.map((link, index) => (
                  <a
                    key={`read-${link.url}-${index}`}
                    className="book-read-btn"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label || "Read Book"}
                  </a>
                ))}
                {audioLinks.map((link, index) => (
                  <a
                    key={`listen-${link.url}-${index}`}
                    className="book-listen-btn"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label || "Listen"}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {book.summary && (
          <section className="book-section">
            <h2>Summary</h2>
            <BlockContent
              blocks={book.summary}
              projectId="o5lg176f"
              dataset="production"
              serializers={serializers}
            />
          </section>
        )}

        {book.tableOfContents && (
          <section className="book-section">
            <h2>Table of Contents</h2>
            <BlockContent
              blocks={book.tableOfContents}
              projectId="o5lg176f"
              dataset="production"
              serializers={serializers}
            />
          </section>
        )}
      </div>
    </Container>
  );
};

export default SingleBook;
