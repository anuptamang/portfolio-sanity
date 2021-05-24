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
            fill='currentColor'
            stroke='currentColor'
            class='w-4 h-4 text-gray-800 dark:text-gray-200'
          >
            <path
              stroke-linecap='round'
              stroke-linejoin='round'
              stroke-width='2'
              d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
            ></path>
          </svg>
        </button>
        <Nav className='d-flex justify-content-end'>
          <NavLink to='/' exact>
            Home
          </NavLink>
          <NavLink to='/about'>About</NavLink>
          <NavLink to='/project'>Projects</NavLink>
          <NavLink to='/post'>Post</NavLink>
        </Nav>
      </Container>
    </header>
  )
}

export default Header
