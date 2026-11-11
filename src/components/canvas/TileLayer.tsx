import { Group, Layer, Rect, Text } from 'react-konva'
import { GRID_UNIT_MM, TILE_STYLE } from '@/constants'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import { tileLabel } from '@/utils/format'
import { CANVAS_FONT } from './EdgeLabel'

interface TileLayerProps {
  scale: number
  offset: { x: number; y: number }
}

/** 배치된 매트/조각을 그린다. 공간 본체 위, 외곽선·핸들 아래. */
export function TileLayer({ scale, offset }: TileLayerProps) {
  const tiles = useFloorPlanStore((s) => s.tiles)
  const dirty = useFloorPlanStore((s) => s.tilingDirty)
  if (tiles.length === 0) return null

  const cellPx = GRID_UNIT_MM * scale

  return (
    <Layer x={offset.x} y={offset.y} listening={false} opacity={dirty ? 0.35 : 1}>
      {tiles.map((t) => {
        const color = t.full ? TILE_STYLE.full.color : TILE_STYLE.cut.color
        const x = t.x * scale
        const y = t.y * scale
        const w = t.width * scale
        const h = t.height * scale
        const fontSize = Math.max(7, Math.min(16, Math.min(w, h) * 0.32))
        const showLabel = w >= 14 && h >= 10

        return (
          <Group key={t.id}>
            {t.cells ? (
              // ㄱ자 등 비직사각형 조각: 셀 단위로 채움
              t.cells.map((c, i) => (
                <Rect
                  key={i}
                  x={c.x * scale}
                  y={c.y * scale}
                  width={cellPx}
                  height={cellPx}
                  fill={color}
                />
              ))
            ) : (
              <Rect x={x} y={y} width={w} height={h} fill={color} />
            )}
            <Rect
              x={x}
              y={y}
              width={w}
              height={h}
              stroke={t.full ? '#ffffff' : '#a16207'}
              strokeWidth={1}
              dash={t.full ? undefined : [3, 2]}
            />
            {showLabel && (
              <Text
                x={x}
                y={y}
                width={w}
                height={h}
                align="center"
                verticalAlign="middle"
                text={tileLabel(t)}
                fontSize={fontSize}
                fontStyle={t.full ? '700' : '600'}
                fontFamily={CANVAS_FONT}
                fill={t.full ? '#1c1917' : '#713f12'}
              />
            )}
          </Group>
        )
      })}
    </Layer>
  )
}
