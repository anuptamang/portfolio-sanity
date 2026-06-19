import BlockContent from "@sanity/block-content-to-react";
import React from "react";
import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import Loader from "../components/Loader";
import BookBlock from "../components/BookBlock";
import serializers from "../components/serializers";
import { fetcher } from "../utils/fetcher";

const SingleAuthor = () => {
  const { slug } = useParams();

  const query = `*[_type== 'bookAuthor' && slug.current == '${slug}']{
      name,
      slug,
      nationality,
      description,
      website,
      wikipediaUrl,
      photo{
        asset->{
          _id,
          url
        }
      },
      bio,
      career,
      achievements,
      "books": *[_type== 'book' && references(^._id)]{
        title,
        slug,
        publishedYear,
        cover{
          asset->{
            _id,
            url
          }
        },
        "authors": authors[]->{ _id, name, slug },
        "categories": categories[]->{ _id, title }
      } | order(publishedYear desc)
    }[0]`;

  const { data: author } = useSWR(query, fetcher);

  if (!author) return <Loader />;

  const photoUrl = author?.photo?.asset?.url;
  const books = author?.books?.filter(Boolean) || [];

  return (
    <Container>
      <div className="author-detail">
        <div className="author-detail-head d-md-flex align-items-center">
          <div
            className="author-photo"
            style={
              photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined
            }
          ></div>
          <div className="author-meta">
            <h1 className="mb-2">
              <span className="curly-brace">{`{ `}</span>
              {author.name}
              <span className="curly-brace">{` }`}</span>
            </h1>
            {author.description && (
              <p className="author-description">{author.description}</p>
            )}
            {author.nationality && (
              <p className="author-nationality">{author.nationality}</p>
            )}
            {author.wikipediaUrl && (
              <p className="author-wikipedia">
                <a
                  href={author.wikipediaUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Wikipedia
                </a>
              </p>
            )}
            {author.website && (
              <p className="author-website">
                <a
                  href={author.website}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {author.website}
                </a>
              </p>
            )}
          </div>
        </div>

        {author.bio && (
          <section className="author-section">
            <h2>Biography</h2>
            <BlockContent
              blocks={author.bio}
              projectId="o5lg176f"
              dataset="production"
              serializers={serializers}
            />
          </section>
        )}

        {author.career && (
          <section className="author-section">
            <h2>Career &amp; Work</h2>
            <BlockContent
              blocks={author.career}
              projectId="o5lg176f"
              dataset="production"
              serializers={serializers}
            />
          </section>
        )}

        {author.achievements && (
          <section className="author-section">
            <h2>Achievements &amp; Legacy</h2>
            <BlockContent
              blocks={author.achievements}
              projectId="o5lg176f"
              dataset="production"
              serializers={serializers}
            />
          </section>
        )}

        <section className="author-section">
          <h2>Publications</h2>
          {books.length === 0 ? (
            <p>No books linked yet.</p>
          ) : (
            <div className="books-holder">
              {books.map((book) => (
                <BookBlock key={book.slug.current} book={book} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
};

export default SingleAuthor;
