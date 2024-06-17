import LogRocket from "logrocket";
import React from "react";
import { Container } from "react-bootstrap";
import useSWR from "swr";
import Loader from "../components/Loader";
import PostBlock from "../components/PostBlock";
import { fetcher } from "../utils/fetcher";
import SanityBlockContent from "@sanity/block-content-to-react";
LogRocket.init("169p6h/test");

const Post = () => {
  const queryBlog = `*[_type== 'blog']{
      title,
      intro
    }[0]`;

  const queryPost = `*[_type== 'post']{
      title,
      slug,
      mainImage{
        asset->{
          _id,
          url
        },
        alt
      },
      publishedAt,
      minRead
    }`;

  const { data: blogData } = useSWR(queryBlog, fetcher);
  const { data: postData } = useSWR(queryPost, fetcher);

  console.log(blogData);

  return (
    <>
      {!postData ? (
        <Loader />
      ) : (
        <Container>
          <div className="post-holder">
            <h1 className="mb-2 text-center">
              <span className="curly-brace">{`{ `}</span>
              {blogData && blogData.title}{" "}
              <span className="curly-brace">{` }`}</span>
            </h1>
            <p className="text-center mb-5">
              {blogData && (
                <SanityBlockContent
                  blocks={blogData.intro}
                  projectId="o5lg176f"
                  dataset="production"
                />
              )}
            </p>
            <div className="post-row">
              {postData &&
                postData.map((post, index) => (
                  <PostBlock key={index} post={post} />
                ))}
            </div>
          </div>
        </Container>
      )}
    </>
  );
};

export default Post;
