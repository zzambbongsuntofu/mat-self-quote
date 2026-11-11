import { useEffect, useRef, useState } from 'react'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import { formatArea, formatLength } from '@/utils/format'
import { polygonArea, polygonPerimeter } from '@/utils/geometry'
import { PanelCard } from './PanelCard'

export function RoomList() {
  const rooms = useFloorPlanStore((s) => s.rooms)
  const selectedRoomId = useFloorPlanStore((s) => s.selectedRoomId)
  const selectRoom = useFloorPlanStore((s) => s.selectRoom)
  const removeRoom = useFloorPlanStore((s) => s.removeRoom)
  const updateRoom = useFloorPlanStore((s) => s.updateRoom)
  const setTool = useFloorPlanStore((s) => s.setTool)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId) inputRef.current?.select()
  }, [editingId])

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setDraftName(name)
  }

  const commitEdit = () => {
    if (editingId) {
      const name = draftName.trim()
      if (name) updateRoom(editingId, { name })
    }
    setEditingId(null)
  }

  return (
    <PanelCard
      title="공간 목록"
      description="클릭하여 선택, 더블클릭으로 이름 변경"
      action={
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
          {rooms.length}
        </span>
      }
    >
      {rooms.length === 0 ? (
        <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-xs text-stone-500">
          캔버스에서 영역을 그리면 여기에 표시됩니다
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rooms.map((room) => {
            const active = room.id === selectedRoomId
            const editing = room.id === editingId
            const areaM2 = polygonArea(room.points) / 1_000_000
            const perimeter = polygonPerimeter(room.points)
            return (
              <li
                key={room.id}
                onClick={() => {
                  if (editing) return
                  setTool('select')
                  selectRoom(active ? null : room.id)
                }}
                onDoubleClick={() => startEdit(room.id, room.name)}
                className={[
                  'flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 transition',
                  active
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-stone-200 hover:bg-stone-50',
                ].join(' ')}
              >
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <input
                      ref={inputRef}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-md border border-brand-500 bg-white px-2 py-0.5 text-sm font-medium text-stone-900 outline-none"
                    />
                  ) : (
                    <p className="truncate text-sm font-medium text-stone-900">
                      {room.name}
                    </p>
                  )}
                  <p className="text-xs text-stone-500">
                    {formatArea(areaM2)} m² · 둘레 {formatLength(perimeter)} · 꼭짓점{' '}
                    {room.points.length}개
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`${room.name} 삭제`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeRoom(room.id)
                  }}
                  className="ml-2 rounded-md p-1 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </PanelCard>
  )
}
