import React from 'react'
import { Container, Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'
import ThemeToggler from './ThemeToggler'

const Header = () => {
  return (
    <header className='header py-4'>
      <Container className='d-flex justify-content-between align-items-center'>
        <ThemeToggler />
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
