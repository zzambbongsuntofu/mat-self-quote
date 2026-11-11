import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import { ToolBar } from '@/components/canvas/ToolBar'
import { PresetBar } from '@/components/canvas/PresetBar'
import { FloorPlanCanvas } from '@/components/canvas/FloorPlanCanvas'

/**
 * 좌측 캔버스 영역.
 * - 상단: 도구 바
 * - 본문: Konva Stage (Step 2에서 Grid/드로잉 구현)
 */
export function CanvasPane() {
  const roomCount = useFloorPlanStore((s) => s.rooms.length)
  const tool = useFloorPlanStore((s) => s.tool)

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">평면도 그리기</h2>
          <p className="mt-0.5 text-sm text-stone-500">
            벽의 모서리를 차례로 클릭해 거실·복도 등 공간을 그리세요. 선은 수평·수직으로만
            그어지며 격자 한 칸은 10cm 입니다.
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
          공간 {roomCount}개
        </span>
      </div>

      <ToolBar />
      {tool === 'draw' && <PresetBar />}

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <FloorPlanCanvas />
      </div>
    </section>
  )
}
