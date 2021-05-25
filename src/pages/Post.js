import React, { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import sanityClient from '../client'
import Loader from '../components/Loader'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(sanityClient)
function urlFor(source) {
  return builder.image(source)
}

const Post = () => {
  const [postData, setPost] = useState(null)

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type== 'post']{
      title,
      slug,
      mainImage{
        asset->{
          _id,
          url
        },
        alt
      }
    }`
      )
      .then((data) => setPost(data))
      .catch(console.error)
  }, [])

  return (
    <>
      {!postData ? (
        <Loader />
      ) : (
        <Container>
          <h1 className='mb-5 text-center'>Blog</h1>
          <div className='post-row'>
            {postData &&
              postData.map((post, index) => (
                <article key={post.slug.current}>
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
                    </div>
                  </Link>
                </article>
              ))}
          </div>
        </Container>
      )}
    </>
  )
}

export default Post
