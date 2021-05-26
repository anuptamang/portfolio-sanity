import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import imageUrlBuilder from '@sanity/image-url'
import sanityClient from '../client'
import BlockContent from '@sanity/block-content-to-react'
import { Container } from 'react-bootstrap'
import Loader from '../components/Loader'
import serializers from '../components/serializers'
import Moment from 'react-moment'

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
      publishedAt,
      body,
      "authorName": author->name,
      "authorImage": author->image,
      minRead
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
            <div className='left d-flex align-items-center'>
              <div
                className='img-author'
                style={{
                  backgroundImage: `url(
                    ${urlFor(singlePost.authorImage).url()}
                  )`,
                }}
              ></div>
              <div className='name'>
                {singlePost.authorName} /{' '}
                <Moment format='MMM D, YYYY'>{singlePost.publishedAt}</Moment>
                &nbsp;
              </div>
            </div>
            <div className='right'> • {singlePost.minRead} min read</div>
          </article>
          <BlockContent
            blocks={singlePost.body}
            projectId='o5lg176f'
            dataset='production'
            serializers={serializers}
          />
        </Container>
      )}
    </>
  )
}

export default SinglePost
