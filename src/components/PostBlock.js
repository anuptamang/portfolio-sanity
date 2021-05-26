import Moment from 'react-moment'
import { Link } from 'react-router-dom'

const PostBlock = ({ post }) => {
  return (
    <>
      <article>
        <Link
          className='post'
          to={`/post/${post.slug.current}`}
          key={post.slug.current}
        >
          <div className='description'>
            <h3>{post.title}</h3>
            <div className='meta d-flex justify-content-between'>
              <p>
                Published on: &nbsp;
                <Moment format='MMM D, YYYY'>{post.publishedAt}</Moment>
              </p>
              <p>{post.minRead} min read</p>
            </div>
          </div>
        </Link>
      </article>
    </>
  )
}

export default PostBlock
