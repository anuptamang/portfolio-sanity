import { BrowserRouter as Router, Route } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import About from './pages/About'
import Post from './pages/Post'
import Home from './pages/Home'
import Project from './pages/Project'
import SinglePost from './pages/SinglePost'
import ScrollToTop from './utils/scrollTop'

function App() {
  return (
    <Router>
      <ScrollToTop>
        <Header />
        <main>
          <Route component={About} path='/about' />
          <Route component={SinglePost} path='/post/:slug' />
          <Route component={Post} path='/post' />
          <Route component={Project} path='/project' />
          <Route component={Home} path='/' exact />
        </main>
        <Footer />
      </ScrollToTop>
    </Router>
  )
}

export default App
