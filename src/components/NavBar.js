import React from 'react'
import { NavLink } from 'react-router-dom'

const NavBar = () => {
  return (
    <header>
      <nav>
        <NavLink to='/' exact>
          Home
        </NavLink>
        <NavLink to='/about'>About</NavLink>
        <NavLink to='/project'>Projects</NavLink>
        <NavLink to='/post'>Post</NavLink>
      </nav>
    </header>
  )
}

export default NavBar
