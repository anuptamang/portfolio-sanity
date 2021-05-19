import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import sanityClient from '../client'

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
    <main>
      <section>
        <h1>Blog Post Page</h1>
        <h2>Welcome to my page of blog posts</h2>
        <div>
          {postData &&
            postData.map((post, index) => (
              <article>
                <Link to={`/post/${post.slug.current}`} key={post.slug.current}>
                  <img src={post.mainImage.asset.url} alt='' />
                  <h3>{post.title}</h3>
                </Link>
              </article>
            ))}
        </div>
      </section>
    </main>
  )
}

export default Post
