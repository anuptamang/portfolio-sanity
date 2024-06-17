import BlockContent from "@sanity/block-content-to-react";
import imageUrlBuilder from "@sanity/image-url";
import React from "react";
import { Container } from "react-bootstrap";
import Moment from "react-moment";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import sanityClient from "../client";
import Loader from "../components/Loader";
import serializers from "../components/serializers";
import { fetcher } from "../utils/fetcher";

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

const SinglePost = () => {
  const { slug } = useParams();

  const query = `*[slug.current == '${slug}']{
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
    }[0]`;

  const { data: singlePost } = useSWR(query, fetcher);

  return (
    <>
      {!singlePost ? (
        <Loader />
      ) : (
        <Container>
          <h1 className="mb-4">
            <span className="curly-brace">{`{ `}</span>
            {singlePost.title}
            <span className="curly-brace">{` }`}</span>
          </h1>
          <article className="d-flex align-items-center post-meta">
            <div className="left d-flex align-items-center">
              <div
                className="img-author"
                style={{
                  backgroundImage: `url(
                    ${urlFor(singlePost.authorImage).url()}
                  )`,
                }}
              ></div>
              <div className="name">
                {singlePost.authorName} /{" "}
                <Moment format="MMM D, YYYY">{singlePost.publishedAt}</Moment>
                &nbsp;
              </div>
            </div>
            <div className="right"> • {singlePost.minRead} min read</div>
          </article>
          <div
            className="img-holder"
            style={{
              height: "300px",
              objectFit: "cover",
              borderRadius: "10px",
              marginBottom: "50px",
              boxShadow: "0 0 2px rgba(106 ,133 ,160,0.3)",
              backgroundImage: `url(${singlePost?.mainImage?.asset?.url})`,
            }}
          ></div>

          <BlockContent
            blocks={singlePost.body}
            projectId="o5lg176f"
            dataset="production"
            serializers={serializers}
          />
        </Container>
      )}
    </>
  );
};

export default SinglePost;
