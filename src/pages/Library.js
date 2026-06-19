import React, { useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import useSWR from "swr";
import SanityBlockContent from "@sanity/block-content-to-react";
import Loader from "../components/Loader";
import BookBlock from "../components/BookBlock";
import { fetcher } from "../utils/fetcher";

const PAGE_SIZE = 12;

const sortByTitle = (a, b) => a.title.localeCompare(b.title);

const Library = () => {
  const queryLibrary = `*[_type== 'library']{
      title,
      intro
    }[0]`;

  const queryBooks = `*[_type== 'book']{
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
    } | order(title asc)`;

  const { data: libraryData } = useSWR(queryLibrary, fetcher);
  const { data: bookData } = useSWR(queryBooks, fetcher);

  const [genre, setGenre] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { genreOptions, authorOptions, yearOptions } = useMemo(() => {
    const genreMap = new Map();
    const authorMap = new Map();
    const yearSet = new Set();
    (bookData || []).forEach((book) => {
      (book.categories || []).forEach((c) => {
        if (c) genreMap.set(c._id, c.title);
      });
      (book.authors || []).forEach((a) => {
        if (a) authorMap.set(a._id, a.name);
      });
      if (book.publishedYear) yearSet.add(book.publishedYear);
    });
    const toSorted = (map) =>
      Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    return {
      genreOptions: [{ value: "", label: "All genres" }, ...toSorted(genreMap)],
      authorOptions: [
        { value: "", label: "All authors" },
        ...toSorted(authorMap),
      ],
      yearOptions: [
        { value: "", label: "All years" },
        ...Array.from(yearSet)
          .sort((a, b) => b - a)
          .map((y) => ({ value: String(y), label: String(y) })),
      ],
    };
  }, [bookData]);

  const filteredBooks = useMemo(() => {
    if (!bookData) return [];
    const query = search.trim().toLowerCase();
    const result = bookData.filter((book) => {
      const genreOk =
        !genre || (book.categories || []).some((c) => c && c._id === genre);
      const authorOk =
        !author || (book.authors || []).some((a) => a && a._id === author);
      const yearOk = !year || String(book.publishedYear) === year;
      const searchOk =
        !query ||
        book.title.toLowerCase().includes(query) ||
        (book.authors || []).some(
          (a) => a && a.name && a.name.toLowerCase().includes(query)
        ) ||
        (book.categories || []).some(
          (c) => c && c.title && c.title.toLowerCase().includes(query)
        );
      return genreOk && authorOk && yearOk && searchOk;
    });
    return result.sort(sortByTitle);
  }, [bookData, genre, author, year, search]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleBooks = filteredBooks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const hasActiveFilters = Boolean(genre || author || year || search.trim());

  const resetFilters = () => {
    setGenre("");
    setAuthor("");
    setYear("");
    setSearch("");
    setPage(1);
  };

  return (
    <>
      {!bookData ? (
        <Loader />
      ) : (
        <Container>
          <div className="library-holder">
            <h1 className="mb-2 text-center">
              <span className="curly-brace">{`{ `}</span>
              {libraryData ? libraryData.title : "Library"}{" "}
              <span className="curly-brace">{` }`}</span>
            </h1>
            {libraryData && libraryData.intro && (
              <div className="text-center mb-4">
                <SanityBlockContent
                  blocks={libraryData.intro}
                  projectId="o5lg176f"
                  dataset="production"
                />
              </div>
            )}

            <div className="filter-bar">
              <div className="filter-field filter-field-search">
                <label htmlFor="filter-search">Search</label>
                <input
                  id="filter-search"
                  type="search"
                  placeholder="Title, author, genre…"
                  value={search}
                  onChange={(e) => handleFilter(setSearch)(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="filter-genre">Genre</label>
                <select
                  id="filter-genre"
                  value={genre}
                  onChange={(e) => handleFilter(setGenre)(e.target.value)}
                >
                  {genreOptions.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="filter-author">Author</label>
                <select
                  id="filter-author"
                  value={author}
                  onChange={(e) => handleFilter(setAuthor)(e.target.value)}
                >
                  {authorOptions.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="filter-year">Year</label>
                <select
                  id="filter-year"
                  value={year}
                  onChange={(e) => handleFilter(setYear)(e.target.value)}
                >
                  {yearOptions.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-actions">
                <p className="filter-count">
                  {filteredBooks.length}{" "}
                  {filteredBooks.length === 1 ? "book" : "books"}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="filter-reset-btn"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <p className="text-center">
                {bookData.length === 0
                  ? "No books yet. Add them in Sanity Studio or run npm run seed."
                  : "No books match these filters."}
              </p>
            ) : (
              <>
                <div className="books-holder">
                  {visibleBooks.map((book) => (
                    <BookBlock key={book.slug.current} book={book} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      className="page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          className={`page-btn ${
                            p === currentPage ? "active" : ""
                          }`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      className="page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Container>
      )}
    </>
  );
};

export default Library;
