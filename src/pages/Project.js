import React, { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import sanityClient from '../client'
import Loader from '../components/Loader'
import ProjectBlock from '../components/ProjectBlock'

const Project = () => {
	const [projectData, setProject] = useState(null)

	console.log(projectData)

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
      repoUrl,
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
					<h1 className='mb-5'>
						<span className='curly-brace'>{`{ `}</span>Projects{' '}
						<span className='curly-brace'>{`} `}</span>
					</h1>
					<div className='projects-holder'>
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
