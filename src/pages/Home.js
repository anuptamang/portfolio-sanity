import React from 'react'
import { Container } from 'react-bootstrap'

const Home = () => {
  return (
    <Container>
      <div className='intro'>
        <div
          className='img-holder'
          style={{ backgroundImage: `url(/assets/images/akt-transparent.png)` }}
        ></div>
        <h1>
          <span className='curly-brace'>{`{ `}</span>Hi 👋🏻 I'm Anup!
          <span className='curly-brace'>{` }`}</span>
        </h1>
        <h6>
          I'm a Frontend Web Developer from Nepal
          <span className='country'>🇳🇵</span>
        </h6>
        <p>
          I primarily work with HTML, CSS, JavaScript, TypeScript, React and
          RESTful API's in the Frontend.
          <br /> I am currently practicing Fullstack with Node.js, MongoDB and
          Express.js.
        </p>
      </div>
    </Container>
  )
}

export default Home
