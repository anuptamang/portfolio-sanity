import React, { createContext, useReducer } from 'react'

export const ThemeContext = createContext()

const themeFromLocalStorage = localStorage.getItem('theme')
  ? JSON.parse(localStorage.getItem('theme'))
  : { darkMode: true }

const initialState = {
  darkMode: themeFromLocalStorage.darkMode,
}

const themeReducer = (state, action) => {
  switch (action.type) {
    case 'LIGHTMODE':
      return { darkMode: false }
    case 'DARKMODE':
      return { darkMode: true }
    default:
      return state
  }
}

export function ThemeProvider(props) {
  const [state, dispatch] = useReducer(themeReducer, initialState)
  localStorage.setItem('theme', JSON.stringify(state))

  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      {props.children}
    </ThemeContext.Provider>
  )
}
