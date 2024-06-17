import React from "react";
import { Container } from "react-bootstrap";
import useSWR from "swr";
import Loader from "../components/Loader";
import ProjectBlock from "../components/ProjectBlock";
import { fetcher } from "../utils/fetcher";

const Project = () => {
  const query = `*[_type== 'project']{
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
    }`;

  const { data: projectData } = useSWR(query, fetcher);

  return (
    <>
      {!projectData ? (
        <Loader />
      ) : (
        <Container>
          <h1 className="mb-5">
            <span className="curly-brace">{`{ `}</span>Projects{" "}
            <span className="curly-brace">{`} `}</span>
          </h1>
          <div className="projects-holder">
            {projectData &&
              projectData.map((project, index) => (
                <ProjectBlock key={index} project={project} />
              ))}
          </div>
        </Container>
      )}
    </>
  );
};

export default Project;
