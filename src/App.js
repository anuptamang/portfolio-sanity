import { BrowserRouter, Route, Switch } from 'react-router-dom'
import './App.css'
import About from './components/About'
import Home from './components/Home'
import NavBar from './components/NavBar'
import Post from './components/Post'
import Project from './components/Project'
import SinglePost from './components/SinglePost'

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Switch>
        <Route component={Home} path='/' exact />
        <Route component={About} path='/about' />
        <Route component={SinglePost} path='/post/:slug' />
        <Route component={Post} path='/post' />
        <Route component={Project} path='/project' />
      </Switch>
    </BrowserRouter>
  )
}

export default App
