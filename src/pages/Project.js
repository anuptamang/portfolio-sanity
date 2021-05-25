import BlockContent from '@sanity/block-content-to-react'
import ImageUrlBuilder from '@sanity/image-url'
import React, { useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import sanityClient from '../client'
import Loader from '../components/Loader'

const builder = ImageUrlBuilder(sanityClient)
function urlFor(source) {
  return builder.image(source)
}

const Project = () => {
  const [projectData, setProject] = useState(null)

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type== 'project']{
      title,
      _id,
      mainImage{
        asset->{
          _id,
          url
        },
      },
      demoUrl,
      description
    }`
      )
      .then((data) => setProject(data))
      .catch(console.error)
  }, [])

  return (
    <>
      {!projectData ? (
        <Loader />
      ) : (
        <Container>
          <h1 className='mb-5 text-center'>Projects:</h1>
          <Row>
            {projectData &&
              projectData.map((project, index) => (
                <Col md={6}>
                  <a
                    key={index}
                    className='project-block'
                    target='_blank'
                    rel='noreferrer noopener'
                    href={project.demoUrl}
                    style={{
                      'background-image': `url(
                      ${urlFor(project.mainImage).url()}
                    )`,
                    }}
                  >
                    <div className='caption'>
                      <h3>{project.title}</h3>
                      <div className='description'>
                        <BlockContent
                          blocks={project.description}
                          projectId='o5lg176f'
                          dataset='production'
                        />
                      </div>
                    </div>
                  </a>
                </Col>
              ))}
          </Row>
        </Container>
      )}
    </>
  )
}

export default Project
