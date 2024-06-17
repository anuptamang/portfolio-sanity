import SanityBlockContent from "@sanity/block-content-to-react";

const FullstackInfo = ({ description }) => {
  return (
    <>
      <div className="list-unstyled list-responsibility">
        <SanityBlockContent
          blocks={description}
          projectId="o5lg176f"
          dataset="production"
        />
      </div>
    </>
  );
};

export default FullstackInfo;
