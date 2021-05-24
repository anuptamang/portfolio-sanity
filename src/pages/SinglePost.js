import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import imageUrlBuilder from '@sanity/image-url'
import sanityClient from '../client'
import BlockContent from '@sanity/block-content-to-react'
import { Container } from 'react-bootstrap'
import Loader from '../components/Loader'

const builder = imageUrlBuilder(sanityClient)
function urlFor(source) {
  return builder.image(source)
}

const SinglePost = () => {
  const [singlePost, setSinglePost] = useState(null)
  const { slug } = useParams()

  useEffect(() => {
    sanityClient
      .fetch(
        `*[slug.current == '${slug}']{
      title,
      _id,
      slug,
      mainImage{
        asset->{
          _id,
          url
        },
      },
      body,
      "name": author->name,
      "authorImage": author->image
    }`
      )
      .then((data) => setSinglePost(data[0]))
      .catch(console.error)
  }, [slug])

  return (
    <>
      {!singlePost ? (
        <Loader />
      ) : (
        <Container>
          <h1 className='mb-4'>{singlePost.title}</h1>
          <article className='d-flex align-items-center post-meta'>
            <div
              className='img-author'
              style={{
                'background-image': `url(
                  ${urlFor(singlePost.authorImage).url()}
                )`,
              }}
            ></div>
            <div className='name'>{singlePost.name}</div>
          </article>
          <BlockContent
            blocks={singlePost.body}
            projectId='o5lg176f'
            dataset='production'
          />
        </Container>
      )}
    </>
  )
}

export default SinglePost
