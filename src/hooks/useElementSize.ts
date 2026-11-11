import { useLayoutEffect, useRef, useState } from 'react'

interface Size {
  width: number
  height: number
}

/**
 * 컨테이너 요소의 크기를 ResizeObserver 로 추적한다.
 * Konva Stage 는 고정 px 크기를 요구하므로 반응형 레이아웃에 필수.
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}
