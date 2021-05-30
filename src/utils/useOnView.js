import { useEffect, useRef, useState } from 'react'

const useOnView = ({ options }) => {
  const galleryRef = useRef(null)
  const [isInView, setIsInView] = useState(false)

  const callbackFunction = (entries) => {
    const [entry] = entries
    setIsInView(entry.isIntersecting)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(callbackFunction, options)
    if (galleryRef.current) observer.observe(galleryRef.current)

    return () => {
      observer.disconnect()
    }
  }, [galleryRef, options])

  return [galleryRef, isInView]
}

export default useOnView
