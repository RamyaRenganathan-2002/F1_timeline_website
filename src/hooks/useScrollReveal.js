import { useEffect, useRef } from 'react'

export function useScrollReveal(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
        } else {
          el.classList.remove('visible')
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px', ...options }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}