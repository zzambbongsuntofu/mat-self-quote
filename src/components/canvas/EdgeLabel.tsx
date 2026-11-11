import { Label, Tag, Text } from 'react-konva'
import type { Point } from '@/types'
import { edgeLength, isHorizontal } from '@/utils/geometry'
import { formatLength } from '@/utils/format'

interface EdgeLabelProps {
  a: Point
  b: Point
  scale: number
  color?: string
  /** 변에서 라벨을 띄울 거리 (px) */
  gap?: number
}

export const CANVAS_FONT = 'Pretendard Variable, Pretendard, sans-serif'

/** 변 중앙에 길이 라벨("350cm (3.5m)")을 표시 */
export function EdgeLabel({ a, b, scale, color = '#0058a3', gap = 10 }: EdgeLabelProps) {
  const len = edgeLength(a, b)
  if (len <= 0) return null

  const mx = ((a.x + b.x) / 2) * scale
  const my = ((a.y + b.y) / 2) * scale
  const horizontal = isHorizontal(a, b)

  return (
    <Label
      x={horizontal ? mx : mx + gap}
      y={horizontal ? my - gap : my}
      listening={false}
    >
      <Tag
        fill="rgba(255,255,255,0.92)"
        stroke={color}
        strokeWidth={0.75}
        cornerRadius={4}
        pointerDirection={horizontal ? 'down' : 'left'}
        pointerWidth={6}
        pointerHeight={4}
      />
      <Text
        text={formatLength(len)}
        fontSize={11}
        fontStyle="500"
        fontFamily={CANVAS_FONT}
        fill={color}
        padding={4}
      />
    </Label>
  )
}
