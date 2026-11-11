import type { ToolMode } from '@/types'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'

const TOOLS: { id: ToolMode; label: string; hint: string }[] = [
  { id: 'draw', label: '벽선 그리기', hint: 'R' },
  { id: 'select', label: '선택 / 편집', hint: 'V' },
]

export function ToolBar() {
  const tool = useFloorPlanStore((s) => s.tool)
  const setTool = useFloorPlanStore((s) => s.setTool)
  const selectedRoomId = useFloorPlanStore((s) => s.selectedRoomId)
  const removeRoom = useFloorPlanStore((s) => s.removeRoom)
  const clearRooms = useFloorPlanStore((s) => s.clearRooms)
  const hasRooms = useFloorPlanStore((s) => s.rooms.length > 0)

  return (
    <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-1">
        {TOOLS.map((t) => {
          const active = tool === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              aria-pressed={active}
              className={[
                'flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
              ].join(' ')}
            >
              {t.label}
              <kbd className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">
                {t.hint}
              </kbd>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!selectedRoomId}
          onClick={() => selectedRoomId && removeRoom(selectedRoomId)}
          className="whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          선택 삭제
        </button>
        <button
          type="button"
          disabled={!hasRooms}
          onClick={clearRooms}
          className="whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          전체 초기화
        </button>
      </div>
    </div>
  )
}
