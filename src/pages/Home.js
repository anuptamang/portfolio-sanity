import React from 'react'
import { Container } from 'react-bootstrap'
import akt from '../images/akt-transparent.png'

const Home = () => {
  return (
    <Container>
      <div className='intro'>
        <div
          className='img-holder'
          style={{ backgroundImage: `url(${akt})` }}
        ></div>
        <h1>Hi 👋 I'm Anup!</h1>
        <h6>
          I'm a Fullstack Web Developer from Nepal
          <span className='country'>🇳🇵</span>
        </h6>
        <p>
          I primarily work with HTML, CSS, JavaScript, React, Next and jQuery in
          the Frontend<br></br> and Node, Express, Mongo, Firebase, Sanity.io,
          PHP/Wordpress in the Fullstack.
        </p>
      </div>
    </Container>
  )
}

export default Home
