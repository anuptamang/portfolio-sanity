import SanityBlockContent from "@sanity/block-content-to-react";
import React from "react";
import { Container } from "react-bootstrap";
import useSWR from "swr";
import { Timeline, TimelineItem } from "vertical-timeline-component-for-react";
import FullstackInfo from "../components/FullstackInfo";
import { fetcher } from "../utils/fetcher";

const About = () => {
  const query = `*[_type== 'about']{
      name,
      nameLocale,
      job,
      country,
      _id,
      image{
        asset->{
          _id,
          url
        },
      },
      updatedAt,
      intro,
      experiences,
      bio,
      "cvUrl": cv.asset->url
    }[0]`;
  const { data: aboutData } = useSWR(query, fetcher);

  return (
    <Container>
      <div className="intro-about mb-4 pb-4">
        <h1 className="mb-5">
          <span className="curly-brace">{`{ `}</span>About Me
          <span className="curly-brace">{` }`}</span>
        </h1>
        {aboutData && (
          <SanityBlockContent
            blocks={aboutData.bio}
            projectId="o5lg176f"
            dataset="production"
          />
        )}
        <p>
          <a
            href={aboutData && aboutData.cvUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            📎 View My Resume
          </a>
        </p>
      </div>
      <h2>
        <span className="curly-brace">{`{ `}</span>Work Experience
        <span className="curly-brace">{` }`}</span>
      </h2>
      {aboutData && (
        <Timeline lineColor={"#ddd"}>
          {aboutData &&
            aboutData.experiences.map((exp, index) => (
              <TimelineItem
                key={index}
                dateText={`${exp.startDate} - ${exp.endDate}`}
                bodyContainerStyle={{
                  padding: "20px",
                  borderRadius: "5px",
                  boxShadow: "0 0 2px rgba(106 ,133 ,160,0.3)",
                }}
              >
                <h2 className="h5">{exp.role}</h2>
                <p>
                  {exp.company}
                  <a
                    href={exp.website}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {""} ({exp.website})
                  </a>
                </p>
                <h6>Duties & Responsibilities:</h6>
                <FullstackInfo description={exp.description} />
              </TimelineItem>
            ))}
        </Timeline>
      )}
    </Container>
  );
};

export default About;
