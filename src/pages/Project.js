import BlockContent from '@sanity/block-content-to-react'
import ImageUrlBuilder from '@sanity/image-url'
import React, { useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import sanityClient from '../client'
import Loader from '../components/Loader'
import ProjectBlock from '../components/ProjectBlock'

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
          <div>
            {projectData &&
              projectData.map((project, index) => (
                <ProjectBlock key={index} project={project} />
              ))}
          </div>
        </Container>
      )}
    </>
  )
}

export default Project
