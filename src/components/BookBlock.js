import { Link } from "react-router-dom";

const BookBlock = ({ book }) => {
  const coverUrl = book?.cover?.asset?.url;
  const authors = book?.authors?.filter(Boolean) || [];
  const categories = book?.categories?.filter(Boolean) || [];

  return (
    <article className="book-card">
      <Link className="book-card-link" to={`/library/${book.slug.current}`}>
        <div
          className="book-cover"
          style={
            coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined
          }
        >
          {!coverUrl && <span className="book-cover-fallback">{book.title}</span>}
        </div>
        <div className="book-info">
          <h3 className="book-title">{book.title}</h3>
          {authors.length > 0 && (
            <p className="book-authors">
              {authors.map((a) => a.name).join(", ")}
            </p>
          )}
          {book.publishedYear && (
            <p className="book-year">{book.publishedYear}</p>
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
        </div>
      </Link>
    </article>
  );
};

export default BookBlock;
