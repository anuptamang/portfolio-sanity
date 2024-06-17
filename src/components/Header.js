import React from "react";
import { Container, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import ThemeToggler from "./ThemeToggler";
import useSWR from "swr";
import { fetcher } from "../utils/fetcher";

const Header = () => {
  const query = `*[_type== 'about']{
      name,
      nameLocale,
    }[0]`;

  const { data: aboutData } = useSWR(query, fetcher);

  return (
    <header className="header py-4">
      <Container className="d-flex justify-content-between align-items-center">
        <div className="header-left d-flex align-items-center">
          <div className="logo-holder d-flex align-items-center">
            <span className="tag opening-tag"></span>
            <NavLink to="/" className="logo">
              {aboutData && (
                <>
                  <span className="nepali-name">{aboutData.nameLocale}</span>~
                  <span className="english-name">
                    {aboutData.name.split(" ")[0]}
                  </span>
                </>
              )}
            </NavLink>
            <span className="tag self-closing-tag"></span>
            <span className="tag closing-tag"></span>
          </div>
          <div className="nav-holder d-flex">
            <Nav className="d-flex justify-content-end">
              <NavLink to="/" activeClassName="active" exact>
                Home
              </NavLink>
              <NavLink to="/about" activeClassName="active">
                About
              </NavLink>
              <NavLink to="/project" activeClassName="active">
                Projects
              </NavLink>
              <NavLink to="/blog" activeClassName="active">
                Blog
              </NavLink>
            </Nav>
          </div>
        </div>
        <div className="component-holder">
          <ThemeToggler />
        </div>
      </Container>
    </header>
  );
};

export default Header;
