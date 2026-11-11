import { FLOOR_PLAN_PRESETS } from '@/constants/presets'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import { formatArea } from '@/utils/format'

/** 벽선 그리기 모드에서 도구 바 아래에 표시되는 평형 프리셋 칩 */
export function PresetBar() {
  const hasRooms = useFloorPlanStore((s) => s.rooms.length > 0)
  const loadPreset = useFloorPlanStore((s) => s.loadPreset)

  const handleLoad = (id: string) => {
    const preset = FLOOR_PLAN_PRESETS.find((p) => p.id === id)
    if (!preset) return
    if (hasRooms && !window.confirm('기존에 그린 공간을 지우고 불러올까요?')) return
    loadPreset([{ name: preset.label, points: preset.points }])
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 px-4 py-2.5">
      <span className="shrink-0 text-xs font-medium text-stone-500">평수로 시작</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {FLOOR_PLAN_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleLoad(p.id)}
            title={`${p.width / 10} × ${p.height / 10} cm · ${formatArea(p.areaM2)} m²`}
            className="group flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
          >
            {p.label}
            <span className="text-[10px] font-normal text-stone-400 group-hover:text-brand-600">
              {Math.round(p.areaM2)}m²
            </span>
          </button>
        ))}
      </div>
      <span className="ml-auto hidden shrink-0 text-[11px] text-stone-400 xl:inline">
        불러온 뒤 벽을 끌어 모양을 맞추세요
      </span>
    </div>
  )
}
