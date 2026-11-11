import { Group, Layer, Rect, Text } from 'react-konva'
import { GRID_UNIT_MM, TILE_STYLE } from '@/constants'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import { tileLabel } from '@/utils/format'
import { snapPx, spanPx } from '@/utils/geometry'
import { CANVAS_FONT } from './EdgeLabel'

interface TileLayerProps {
  scale: number
  offset: { x: number; y: number }
}

/** 배치된 매트/조각을 그린다. 공간 본체 위, 외곽선·핸들 아래. */
export function TileLayer({ scale, offset }: TileLayerProps) {
  const tiles = useFloorPlanStore((s) => s.tiles)
  const rooms = useFloorPlanStore((s) => s.rooms)
  const dirty = useFloorPlanStore((s) => s.tilingDirty)
  if (tiles.length === 0) return null

  return (
    <Layer
      x={offset.x}
      y={offset.y}
      listening={false}
      opacity={dirty ? 0.35 : 1}
      clipFunc={(ctx) => {
        // 매트 칠이 벽선 밖으로 나가지 않게 공간 폴리곤으로 자른다
        ctx.beginPath()
        for (const room of rooms) {
          const pts = room.points
          if (pts.length < 3) continue
          ctx.moveTo(snapPx(pts[0].x, scale), snapPx(pts[0].y, scale))
          for (let i = 1; i < pts.length; i++) ctx.lineTo(snapPx(pts[i].x, scale), snapPx(pts[i].y, scale))
          ctx.closePath()
        }
      }}
    >
      {tiles.map((t) => {
        const color = t.full ? TILE_STYLE.full.color : TILE_STYLE.cut.color
        const box = spanPx(t.x, t.width, scale)
        const boy = spanPx(t.y, t.height, scale)
        const x = box.pos
        const y = boy.pos
        const w = box.size
        const h = boy.size
        const fontSize = Math.max(7, Math.min(16, Math.min(w, h) * 0.32))
        const showLabel = w >= 14 && h >= 10

        return (
          <Group key={t.id}>
            {t.cells ? (
              t.cells.map((c, i) => {
                const cx = spanPx(c.x, GRID_UNIT_MM, scale)
                const cy = spanPx(c.y, GRID_UNIT_MM, scale)
                return (
                  <Rect
                    key={i}
                    x={cx.pos}
                    y={cy.pos}
                    width={cx.size}
                    height={cy.size}
                    fill={color}
                    perfectDrawEnabled={false}
                  />
                )
              })
            ) : (
              <Rect x={x} y={y} width={w} height={h} fill={color} perfectDrawEnabled={false} />
            )}
            <Rect
              x={x}
              y={y}
              width={w}
              height={h}
              stroke={t.full ? '#ffffff' : '#a16207'}
              strokeWidth={1}
              dash={t.full ? undefined : [3, 2]}
              perfectDrawEnabled={false}
              listening={false}
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
                listening={false}
              />
            )}
          </Group>
        )
      })}
    </Layer>
  )
}
