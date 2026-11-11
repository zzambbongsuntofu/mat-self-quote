import { useMemo } from 'react'
import { Layer, Line, Rect, Text } from 'react-konva'
import { GRID_UNIT_MM } from '@/constants'
import { snapPx } from '@/utils/geometry'

interface GridLayerProps {
  width: number
  height: number
  /** px per mm */
  scale: number
  /** 캔버스 원점 오프셋 (px) */
  offset: { x: number; y: number }
}

const MINOR_COLOR = '#ebe9e6'
const MAJOR_COLOR = '#d6d3cf'
const LABEL_COLOR = '#a8a29e'

/**
 * 10cm 격자 배경. 1m 마다 굵은 선과 치수 라벨을 표시한다.
 * 스케일이 작아 10cm 선이 너무 촘촘해지면 minor 선은 생략한다.
 */
export function GridLayer({ width, height, scale, offset }: GridLayerProps) {
  const lines = useMemo(() => {
    const stepMm = GRID_UNIT_MM * scale >= 6 ? GRID_UNIT_MM : GRID_UNIT_MM * 10
    const items: { points: number[]; major: boolean }[] = []
    const labels: { x: number; y: number; text: string; axis: 'x' | 'y' }[] = []

    const firstMm = (origin: number) => Math.floor(-origin / scale / stepMm) * stepMm
    const lastMm = (origin: number, extent: number) =>
      Math.ceil((extent - origin) / scale / stepMm) * stepMm

    for (let mm = firstMm(offset.x); mm <= lastMm(offset.x, width); mm += stepMm) {
      const x = offset.x + snapPx(mm, scale)
      const major = mm % 1000 === 0
      items.push({ points: [x, 0, x, height], major })
      if (major && mm !== 0) {
        labels.push({ x: x + 4, y: 4, text: `${mm / 1000}m`, axis: 'x' })
      }
    }
    for (let mm = firstMm(offset.y); mm <= lastMm(offset.y, height); mm += stepMm) {
      const y = offset.y + snapPx(mm, scale)
      const major = mm % 1000 === 0
      items.push({ points: [0, y, width, y], major })
      if (major && mm !== 0) {
        labels.push({ x: 4, y: y + 3, text: `${mm / 1000}m`, axis: 'y' })
      }
    }
    return { items, labels }
  }, [width, height, scale, offset.x, offset.y])

  return (
    <Layer listening={false}>
      <Rect width={width} height={height} fill="#fafaf9" />
      {lines.items.map((l, i) => (
        <Line
          key={i}
          points={l.points}
          stroke={l.major ? MAJOR_COLOR : MINOR_COLOR}
          strokeWidth={1}
          perfectDrawEnabled={false}
        />
      ))}
      {lines.labels.map((l, i) => (
        <Text
          key={`l${i}`}
          x={l.x}
          y={l.y}
          text={l.text}
          fontSize={10}
          fontFamily="Pretendard Variable, Pretendard, sans-serif"
          fill={LABEL_COLOR}
        />
      ))}
      {/* 원점 표시 */}
      <Line
        points={[offset.x, 0, offset.x, height]}
        stroke="#c7c2bb"
        strokeWidth={1.5}
      />
      <Line
        points={[0, offset.y, width, offset.y]}
        stroke="#c7c2bb"
        strokeWidth={1.5}
      />
    </Layer>
  )
}
