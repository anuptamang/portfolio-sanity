import SanityBlockContent from '@sanity/block-content-to-react'
import imageUrlBuilder from '@sanity/image-url'
import { Link } from 'react-router-dom'
import sanityClient from '../client'
import useOnView from '../utils/useOnView'

const builder = imageUrlBuilder(sanityClient)
function urlFor(source) {
  return builder.image(source)
}

const ProjectBlock = ({ project }) => {
  const [galleryRef, inView] = useOnView({
    root: document.querySelector('.project-holder'),
    rootMargin: '0',
    threshold: 1,
  })

  return (
    <>
      <Link
        to='/'
        className={`project-article d-md-flex ${
          inView ? 'is-notInView is-inView' : 'is-notInView'
        }`}
        ref={galleryRef}
      >
        <div
          className='img-holder'
          style={{
            'background-image': `url(
                  ${urlFor(project.mainImage.asset.url).url()}
                )`,
          }}
        ></div>
        <div className='description'>
          <h3>{project.title}</h3>
          <div className='meta d-flex justify-content-between'>
            <SanityBlockContent
              blocks={project.description}
              projectId='o5lg176f'
              dataset='production'
            />
          </div>
        </div>
      </Link>
    </>
  )
}

export default ProjectBlock
