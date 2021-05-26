import { BrowserRouter as Router, Route } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import About from './pages/About'
import Post from './pages/Post'
import Home from './pages/Home'
import Project from './pages/Project'
import SinglePost from './pages/SinglePost'
import ScrollToTop from './utils/scrollTop'
import { useContext } from 'react'
import { ThemeContext } from './context/ThemeContext'

function App() {
  const theme = useContext(ThemeContext)
  const darkMode = theme.state.darkMode

  return (
    <Router>
      <ScrollToTop>
        <div className={`wrapper ${darkMode && 'dark-mode'}`}>
          <Header />
          <main>
            <Route component={About} path='/about' exact />
            <Route component={Project} path='/project' exact />
            <Route component={Post} path='/post' exact />
            <Route component={SinglePost} path='/post/:slug' exact />
            <Route component={Home} path='/' exact />
          </main>
          <Footer />
        </div>
      </ScrollToTop>
    </Router>
  )
}

export default App
