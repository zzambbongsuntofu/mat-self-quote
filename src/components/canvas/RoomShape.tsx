import { Circle, Group, Line, Rect, Text } from 'react-konva'
import type { Point, Room } from '@/types'
import { GRID_UNIT_MM } from '@/constants'
import {
  isHorizontal,
  moveOrthoEdge,
  moveOrthoVertex,
  polygonArea,
  polygonBBox,
  polygonCentroid,
  simplifyOrthoPolygon,
  snap,
  snapPx,
  translatePolygon,
} from '@/utils/geometry'
import { formatArea } from '@/utils/format'
import { CANVAS_FONT, EdgeLabel } from './EdgeLabel'

export const ROOM_STROKE = '#1c1917'
export const ROOM_STROKE_SELECTED = '#0058a3'
const ROOM_FILL = '#ffffff'
const ROOM_FILL_SELECTED = '#f5f9fd'
const LABEL_W = 120
const LABEL_H = 38

const toFlat = (pts: Point[], scale: number) =>
  pts.flatMap((p) => [snapPx(p.x, scale), snapPx(p.y, scale)])

interface RoomBodyProps {
  room: Room
  scale: number
  selected: boolean
  interactive: boolean
  onSelect: () => void
  onChange: (points: Point[]) => void
}

/**
 * 공간 본체 (흰 배경 + 검은 테두리). 선택/평행 이동을 담당.
 * 타일 레이어 아래에 그려진다.
 */
export function RoomBody({ room, scale, selected, interactive, onSelect, onChange }: RoomBodyProps) {
  const gridPx = GRID_UNIT_MM * scale
  return (
    <Line
      points={toFlat(room.points, scale)}
      closed
      fill={selected ? ROOM_FILL_SELECTED : ROOM_FILL}
      stroke={selected ? ROOM_STROKE_SELECTED : ROOM_STROKE}
      strokeWidth={2}
      lineJoin="miter"
      perfectDrawEnabled={false}
      draggable={interactive}
      onClick={onSelect}
      onTap={onSelect}
      onMouseDown={onSelect}
      onDragMove={(e) => {
        const node = e.target
        node.x(snap(node.x(), gridPx))
        node.y(snap(node.y(), gridPx))
      }}
      onDragEnd={(e) => {
        const node = e.target
        const dx = Math.round(node.x() / scale)
        const dy = Math.round(node.y() / scale)
        node.position({ x: 0, y: 0 })
        if (dx || dy) onChange(translatePolygon(room.points, dx, dy))
      }}
    />
  )
}

interface RoomOutlineProps {
  room: Room
  scale: number
  selected: boolean
}

/** 타일 위에 다시 그리는 외곽선 (타일이 테두리를 덮지 않도록) */
export function RoomOutline({ room, scale, selected }: RoomOutlineProps) {
  return (
    <Line
      points={toFlat(room.points, scale)}
      closed
      stroke={selected ? ROOM_STROKE_SELECTED : ROOM_STROKE}
      strokeWidth={2}
      lineJoin="miter"
      perfectDrawEnabled={false}
      listening={false}
    />
  )
}

interface RoomOverlayProps {
  room: Room
  scale: number
  selected: boolean
  interactive: boolean
  /** 타일이 깔려 있으면 이름 라벨에 배경을 넣어 가독성 확보 */
  hasTiles: boolean
  onChange: (points: Point[]) => void
}

/**
 * 공간 오버레이: 이름/면적 라벨, 변 길이, 편집 핸들.
 * 타일 레이어 위에 그려진다.
 */
export function RoomOverlay({ room, scale, selected, interactive, hasTiles, onChange }: RoomOverlayProps) {
  const { points } = room
  const gridPx = GRID_UNIT_MM * scale
  const n = points.length
  const centroid = polygonCentroid(points)
  const bbox = polygonBBox(points) ?? { x: centroid.x, y: centroid.y, width: 0, height: 0 }
  const areaM2 = polygonArea(points) / 1_000_000
  const inlineLabel = `${room.name} · ${formatArea(areaM2)} m²`
  const labelWidth = Math.max(72, inlineLabel.length * 7 + 16)
  const showHandles = selected && interactive
  const stroke = selected ? ROOM_STROKE_SELECTED : ROOM_STROKE

  const commit = (next: Point[]) => {
    const simplified = simplifyOrthoPolygon(next)
    if (simplified.length >= 4 && polygonArea(simplified) > 0) onChange(simplified)
  }

  return (
    <>
      {/* 이름 / 면적 */}
      {hasTiles ? (
        // 타일이 깔리면 매트 번호를 가리지 않도록 도면 바깥 좌상단에 한 줄로 표시
        <Group x={snapPx(bbox.x, scale)} y={snapPx(bbox.y, scale) - 22} listening={false}>
          <Rect
            width={labelWidth}
            height={18}
            fill="rgba(255,255,255,0.92)"
            stroke="#d6d3d1"
            strokeWidth={1}
            cornerRadius={4}
          />
          <Text
            width={labelWidth}
            height={18}
            text={inlineLabel}
            align="center"
            verticalAlign="middle"
            fontSize={11}
            fontStyle="600"
            fontFamily={CANVAS_FONT}
            fill="#1c1917"
          />
        </Group>
      ) : (
        <Group x={snapPx(centroid.x, scale)} y={snapPx(centroid.y, scale)} listening={false}>
          <Text
            x={-LABEL_W / 2}
            y={-LABEL_H / 2}
            width={LABEL_W}
            height={LABEL_H}
            text={`${room.name}\n${formatArea(areaM2)} m²`}
            align="center"
            verticalAlign="middle"
            fontSize={12}
            lineHeight={1.3}
            fontFamily={CANVAS_FONT}
            fill="#1c1917"
          />
        </Group>
      )}

      {selected &&
        points.map((a, i) => (
          <EdgeLabel key={`el-${i}`} a={a} b={points[(i + 1) % n]} scale={scale} color={stroke} />
        ))}

      {showHandles &&
        points.map((a, i) => {
          const b = points[(i + 1) % n]
          const horizontal = isHorizontal(a, b)
          const mx = (snapPx(a.x, scale) + snapPx(b.x, scale)) / 2
          const my = (snapPx(a.y, scale) + snapPx(b.y, scale)) / 2
          return (
            <Rect
              key={`eh-${i}`}
              x={mx - 5}
              y={my - 5}
              width={10}
              height={10}
              fill="#ffffff"
              stroke={stroke}
              strokeWidth={1.5}
              cornerRadius={2}
              draggable
              onMouseEnter={(e) => {
                const c = e.target.getStage()?.container()
                if (c) c.style.cursor = horizontal ? 'ns-resize' : 'ew-resize'
              }}
              onMouseLeave={(e) => {
                const c = e.target.getStage()?.container()
                if (c) c.style.cursor = ''
              }}
              onDragMove={(e) => {
                const node = e.target
                if (horizontal) {
                  node.x(mx - 5)
                  node.y(snap(node.y() + 5, gridPx) - 5)
                } else {
                  node.y(my - 5)
                  node.x(snap(node.x() + 5, gridPx) - 5)
                }
                const value = horizontal
                  ? Math.round((node.y() + 5) / scale)
                  : Math.round((node.x() + 5) / scale)
                onChange(moveOrthoEdge(points, i, value))
              }}
              onDragEnd={() => commit(points)}
            />
          )
        })}

      {showHandles &&
        points.map((p, i) => (
          <Circle
            key={`vh-${i}`}
            x={snapPx(p.x, scale)}
            y={snapPx(p.y, scale)}
            radius={5.5}
            fill="#ffffff"
            stroke={stroke}
            strokeWidth={1.5}
            draggable
            onMouseEnter={(e) => {
              const c = e.target.getStage()?.container()
              if (c) c.style.cursor = 'move'
            }}
            onMouseLeave={(e) => {
              const c = e.target.getStage()?.container()
              if (c) c.style.cursor = ''
            }}
            onDragMove={(e) => {
              const node = e.target
              node.x(snap(node.x(), gridPx))
              node.y(snap(node.y(), gridPx))
              onChange(
                moveOrthoVertex(points, i, {
                  x: Math.round(node.x() / scale),
                  y: Math.round(node.y() / scale),
                }),
              )
            }}
            onDragEnd={() => commit(points)}
          />
        ))}
    </>
  )
}
