import imageUrlBuilder from '@sanity/image-url'
import Moment from 'react-moment'
import { Link } from 'react-router-dom'
import sanityClient from '../client'

const builder = imageUrlBuilder(sanityClient)
function urlFor(source) {
  return builder.image(source)
}

const PostBlock = ({ post }) => {
  return (
    <>
      <article>
        <Link
          className='post d-md-flex'
          to={`/post/${post.slug.current}`}
          key={post.slug.current}
        >
          <div
            className='img-holder'
            style={{
              'background-image': `url(
                  ${urlFor(post.mainImage.asset.url).url()}
                )`,
            }}
          ></div>
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
