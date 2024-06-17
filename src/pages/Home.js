import SanityBlockContent from "@sanity/block-content-to-react";
import React from "react";
import { Container } from "react-bootstrap";
import useSWR from "swr";
import { fetcher } from "../utils/fetcher";

const Home = () => {
  const query = `*[_type== 'about']{
      name,
      job,
      _id,
      image{
        asset->{
          _id,
          url
        },
      },
      intro,
      "cvUrl": cv.asset->url
    }[0]`;

  const { data: aboutData } = useSWR(query, fetcher);

  return (
    <>
      <Container>
        <div className="intro">
          <div
            className="img-holder"
            style={{
              backgroundImage: `url(${aboutData?.image?.asset?.url})`,
            }}
          ></div>
          <h1>
            <span className="curly-brace">{`{ `}</span>Hi 👋🏻 I'm{" "}
            {aboutData && aboutData?.name?.split(" ")[0]}
            <span className="curly-brace">{` }`}</span>
          </h1>
          <h6
            style={{
              textTransform: "uppercase",
            }}
          >
            {aboutData && aboutData?.job}
            {/* from{" "}
            {aboutData && aboutData?.country.split(" ")[0]}
            <span className="country">
              {aboutData && aboutData?.country.split(" ")[1]}
            </span> */}
          </h6>
          <p>
            {aboutData && (
              <SanityBlockContent
                blocks={aboutData.intro}
                projectId="o5lg176f"
                dataset="production"
              />
            )}
          </p>
        </div>
      </Container>
    </>
  );
};

export default Home;
