import React, { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import sanityClient from '../client'
import Loader from '../components/Loader'
import PostBlock from '../components/PostBlock'
import LogRocket from 'logrocket'
LogRocket.init('169p6h/test')

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
      },
      publishedAt,
      minRead
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
          <div className='post-holder'>
            <h1 className='mb-2 text-center'>Hi 👋 , Welcome to my Blog!</h1>
            <p className='text-center mb-5'>
              I write contents related to &nbsp;
              <strong>
                <em>
                  HTML, CSS, SCSS, SVG, Animations, Javascript, jQuery,
                  React.js, Next.js, Node.js, Express, MongoDB, Jamstack,
                  Headless CMS and sometimes various IT related topics!
                </em>
              </strong>
            </p>
            <div className='post-row'>
              {postData &&
                postData.map((post, index) => (
                  <PostBlock key={index} post={post} />
                ))}
            </div>
          </div>
        </Container>
      )}
    </>
  )
}

export default Post
