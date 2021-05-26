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
        <h1>Hi, I'm Anup!</h1>
        <p>
          I'm a Fullstack Web Developer who is addicted to learning and loves
          coding. <br />
          I'm a Frontend Dev by Day and Fullstack at Night!
        </p>
      </div>
    </Container>
  )
}

export default Home
