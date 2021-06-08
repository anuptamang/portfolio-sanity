import React from 'react'
import { Container, Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'
import ThemeToggler from './ThemeToggler'

const Header = () => {
  return (
    <header className='header py-4'>
      <Container className='d-flex justify-content-between align-items-center'>
        <div className='header-left d-flex align-items-center'>
          <div className='logo-holder d-flex align-items-center'>
            <span className='tag opening-tag'></span>
            <NavLink to='/' className='logo'>
              <span className='nepali-name'>अनुप</span>~
              <span className='english-name'>ANUP</span>
            </NavLink>
            <span className='tag self-closing-tag'></span>
            <span className='tag closing-tag'></span>
          </div>
          <div className='nav-holder d-flex'>
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
              <NavLink to='/blog' activeClassName='active'>
                Blog
              </NavLink>
            </Nav>
          </div>
        </div>
        <div className='component-holder'>
          <ThemeToggler />
        </div>
      </Container>
    </header>
  )
}

export default Header
