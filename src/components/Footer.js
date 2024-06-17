import React from "react";
import { Container } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { fetcher } from "../utils/fetcher";
import useSWR from "swr";

const Footer = () => {
  const query = `*[_type== 'about']{
      name,
      _id,
    }[0]`;

  const { data: aboutData } = useSWR(query, fetcher);

  return (
    <footer className="footer text-center">
      <Container>
        <p>
          Built with <span className="love">♡</span> by{" "}
          <NavLink to="/about">{aboutData && aboutData.name}</NavLink>
        </p>
        <p>
          Created with &nbsp;
          <a
            href="https://react.dev/"
            rel="noreferrer noopener"
            target="_blank"
          >
            React.js &nbsp;
          </a>
          • Data from &nbsp;
          <a
            href="https://www.sanity.io/"
            rel="noreferrer noopener"
            target="_blank"
          >
            Sanity.io &nbsp;
          </a>
          • Sourced at &nbsp;
          <a
            href="https://github.com/anuptamang/portfolio-sanity"
            rel="noreferrer noopener"
            target="_blank"
          >
            Github &nbsp;
          </a>
          • Hosted on &nbsp;
          <a
            href="https://www.netlify.com/"
            rel="noreferrer noopener"
            target="_blank"
          >
            Netlify
          </a>
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
