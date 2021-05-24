import React from 'react'
import { useEffect } from 'react'
import { withRouter } from 'react-router'

function ScrollToTop({ history, children }) {
  useEffect(() => {
    const unlisten = history.listen(() => {
      window.scroll({ top: 0, left: 0, behavior: 'smooth' })
    })
    return () => {
      unlisten()
    }
  }, [history])

  return <>{children}</>
}

export default withRouter(ScrollToTop)
