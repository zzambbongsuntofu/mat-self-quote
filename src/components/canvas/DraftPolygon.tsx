import { Circle, Line } from 'react-konva'
import type { Point } from '@/types'
import { EdgeLabel } from './EdgeLabel'

interface DraftPolygonProps {
  /** 확정된 꼭짓점들 */
  points: Point[]
  /** 마지막 점에서 커서까지의 미리보기 끝점 (직교 스냅 적용) */
  cursor: Point | null
  /** 커서가 시작점 위에 있어 닫을 수 있는 상태인지 */
  canClose: boolean
  scale: number
}

const STROKE = '#0058a3'

/** 그리는 중인 벽선 미리보기 */
export function DraftPolygon({ points, cursor, canClose, scale }: DraftPolygonProps) {
  if (points.length === 0) return null

  const flat = points.flatMap((p) => [p.x * scale, p.y * scale])
  const last = points[points.length - 1]
  const first = points[0]

  return (
    <>
      {/* 확정된 변 */}
      {points.length > 1 && (
        <Line points={flat} stroke={STROKE} strokeWidth={2} lineJoin="miter" listening={false} />
      )}
      {points.slice(0, -1).map((a, i) => (
        <EdgeLabel key={`d-${i}`} a={a} b={points[i + 1]} scale={scale} />
      ))}

      {/* 미리보기 변 */}
      {cursor && !canClose && (
        <>
          <Line
            points={[last.x * scale, last.y * scale, cursor.x * scale, cursor.y * scale]}
            stroke={STROKE}
            strokeWidth={1.5}
            dash={[6, 4]}
            listening={false}
          />
          <EdgeLabel a={last} b={cursor} scale={scale} color="#0058a3" />
        </>
      )}

      {/* 닫기 미리보기: 마지막 점 → 시작점 */}
      {canClose && points.length >= 2 && (
        <Line
          points={[last.x * scale, last.y * scale, first.x * scale, first.y * scale]}
          stroke="#16a34a"
          strokeWidth={1.5}
          dash={[6, 4]}
          listening={false}
        />
      )}

      {/* 꼭짓점 */}
      {points.map((p, i) => (
        <Circle
          key={`v-${i}`}
          x={p.x * scale}
          y={p.y * scale}
          radius={i === 0 ? (canClose ? 8 : 6) : 4}
          fill={i === 0 ? (canClose ? '#16a34a' : '#ffffff') : STROKE}
          stroke={i === 0 ? (canClose ? '#16a34a' : STROKE) : undefined}
          strokeWidth={2}
          listening={false}
        />
      ))}
    </>
  )
}
