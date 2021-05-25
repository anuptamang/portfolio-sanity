import React from 'react'
import { Container } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className='footer text-center'>
      <Container>
        <p>
          Built with ♡ by <NavLink to='/about'>Anup K. Tamang</NavLink>
        </p>
        <p>
          Created with &nbsp;
          <a
            href='https://reactjs.org/'
            rel='noreferrer noopener'
            target='_blank'
          >
            React.js &nbsp;
          </a>
          • Data from &nbsp;
          <a
            href='https://www.sanity.io/'
            rel='noreferrer noopener'
            target='_blank'
          >
            Sanity.io &nbsp;
          </a>
          • Sourced at &nbsp;
          <a
            href='https://github.com/anuptamang/portfolio-sanity'
            rel='noreferrer noopener'
            target='_blank'
          >
            Github &nbsp;
          </a>
          • Hosted on &nbsp;
          <a
            href='https://www.netlify.com/'
            rel='noreferrer noopener'
            target='_blank'
          >
            Netlify
          </a>
        </p>
      </Container>
    </footer>
  )
}

export default Footer
