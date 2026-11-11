import { Layer } from 'react-konva'
import type { Point } from '@/types'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import { RoomBody, RoomOutline, RoomOverlay } from './RoomShape'
import { DraftPolygon } from './DraftPolygon'

export interface DraftState {
  points: Point[]
  cursor: Point | null
  canClose: boolean
}

interface LayerProps {
  scale: number
  offset: { x: number; y: number }
}

/** 공간 본체 레이어 (흰 바닥 + 테두리, 선택/이동). 타일 아래. */
export function RoomBodyLayer({ scale, offset }: LayerProps) {
  const rooms = useFloorPlanStore((s) => s.rooms)
  const selectedRoomId = useFloorPlanStore((s) => s.selectedRoomId)
  const tool = useFloorPlanStore((s) => s.tool)
  const selectRoom = useFloorPlanStore((s) => s.selectRoom)
  const updateRoom = useFloorPlanStore((s) => s.updateRoom)
  const interactive = tool === 'select'

  return (
    <Layer x={offset.x} y={offset.y} listening={interactive}>
      {rooms.map((room) => (
        <RoomBody
          key={room.id}
          room={room}
          scale={scale}
          selected={room.id === selectedRoomId}
          interactive={interactive}
          onSelect={() => interactive && selectRoom(room.id)}
          onChange={(points) => updateRoom(room.id, { points })}
        />
      ))}
    </Layer>
  )
}

/** 공간 오버레이 레이어 (외곽선 재묘사, 라벨, 핸들, 드래프트). 타일 위. */
export function RoomOverlayLayer({ scale, offset, draft }: LayerProps & { draft: DraftState }) {
  const rooms = useFloorPlanStore((s) => s.rooms)
  const selectedRoomId = useFloorPlanStore((s) => s.selectedRoomId)
  const tool = useFloorPlanStore((s) => s.tool)
  const updateRoom = useFloorPlanStore((s) => s.updateRoom)
  const hasTiles = useFloorPlanStore((s) => s.tiles.length > 0)
  const interactive = tool === 'select'

  return (
    <Layer x={offset.x} y={offset.y} listening={interactive}>
      {hasTiles &&
        rooms.map((room) => (
          <RoomOutline
            key={`o-${room.id}`}
            room={room}
            scale={scale}
            selected={room.id === selectedRoomId}
          />
        ))}
      {rooms.map((room) => (
        <RoomOverlay
          key={room.id}
          room={room}
          scale={scale}
          selected={room.id === selectedRoomId}
          interactive={interactive}
          hasTiles={hasTiles}
          onChange={(points) => updateRoom(room.id, { points })}
        />
      ))}

      <DraftPolygon
        points={draft.points}
        cursor={draft.cursor}
        canClose={draft.canClose}
        scale={scale}
      />
    </Layer>
  )
}
