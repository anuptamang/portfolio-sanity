import React from 'react'
import { Container, Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'

const Header = () => {
  return (
    <header className='header py-4'>
      <Container className='d-flex justify-content-between align-items-center'>
        <button className='theme-toggle'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            width='24'
            height='24'
            fill='currentColor'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
            ></path>
          </svg>
        </button>
        <Nav className='d-flex justify-content-end'>
          <NavLink to='/' activeClassName='active' exact>
            Home
          </NavLink>
          <NavLink to='/about' activeClassName='active'>
            About
          </NavLink>
          <NavLink to='/project' activeClassName='active'>
            Projects
          </NavLink>
          <NavLink to='/post' activeClassName='active'>
            Blog
          </NavLink>
        </Nav>
      </Container>
    </header>
  )
}

export default Header
