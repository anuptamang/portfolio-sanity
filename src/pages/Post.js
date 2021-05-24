import React, { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import sanityClient from '../client'
import Loader from '../components/Loader'

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
          <h1 className='mb-4'>Blog</h1>
          <div>
            {postData &&
              postData.map((post, index) => (
                <article>
                  <Link
                    to={`/post/${post.slug.current}`}
                    key={post.slug.current}
                  >
                    <img src={post.mainImage.asset.url} alt='' />
                    <h3>{post.title}</h3>
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
