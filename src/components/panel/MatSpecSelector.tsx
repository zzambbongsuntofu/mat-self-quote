import { useEffect, useState } from 'react'
import {
  CUSTOM_SIZE_MAX_MM,
  CUSTOM_SIZE_MIN_MM,
  LARGE_MAT_MM,
  MAT_SPEC_LIST_DESC,
  normalizeCustomSize,
} from '@/constants'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import type { TilingMode } from '@/utils/tiling'
import { PanelCard } from './PanelCard'

const MODES: { id: TilingMode; label: string; hint: string }[] = [
  { id: 'center', label: '중앙 정렬', hint: '방 가운데에서 바깥으로 깔아 양쪽 절단 폭이 대칭' },
  { id: 'economy', label: '자재 절약', hint: '벽에 붙여 시작하는 배치도 비교해 총 매트 수가 가장 적은 쪽 선택' },
]

export function MatSpecSelector() {
  const matSpecId = useFloorPlanStore((s) => s.matSpecId)
  const customSize = useFloorPlanStore((s) => s.customSize)
  const setMatSpec = useFloorPlanStore((s) => s.setMatSpec)
  const setCustomSize = useFloorPlanStore((s) => s.setCustomSize)
  const [customDraft, setCustomDraft] = useState(String(customSize))

  useEffect(() => {
    setCustomDraft(String(customSize))
  }, [customSize])

  const commitCustom = () => {
    const next = normalizeCustomSize(Number(customDraft))
    setCustomDraft(String(next))
    setCustomSize(next)
  }
  const tilingMode = useFloorPlanStore((s) => s.tilingMode)
  const setTilingMode = useFloorPlanStore((s) => s.setTilingMode)
  const applyTiling = useFloorPlanStore((s) => s.applyTiling)
  const clearTiling = useFloorPlanStore((s) => s.clearTiling)
  const hasRooms = useFloorPlanStore((s) => s.rooms.length > 0)
  const hasTiles = useFloorPlanStore((s) => s.tiles.length > 0)
  const dirty = useFloorPlanStore((s) => s.tilingDirty)

  return (
    <PanelCard title="매트 규격" description="소형부터 대형(1.2m)까지, 한 장 크기를 선택하세요">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          disabled={!hasRooms}
          onClick={applyTiling}
          className={[
            'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition',
            'disabled:cursor-not-allowed disabled:opacity-40',
            dirty ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-500 hover:bg-brand-600',
          ].join(' ')}
        >
          {hasTiles ? (dirty ? '도면이 바뀌었어요 · 다시 배치' : '다시 배치하기') : '매트 배치하기'}
        </button>
        {hasTiles && (
          <button
            type="button"
            onClick={clearTiling}
            className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
          >
            지우기
          </button>
        )}
      </div>
      {!hasRooms && (
        <p className="-mt-2 mb-4 text-xs text-stone-400">먼저 캔버스에 공간을 그려 주세요</p>
      )}

      <div role="radiogroup" className="grid grid-cols-2 gap-2">
        {MAT_SPEC_LIST_DESC.map((spec) => {
          const active = spec.id === matSpecId
          const large = spec.size >= LARGE_MAT_MM
          const areaM2 = (spec.size * spec.size) / 1_000_000
          return (
            <button
              key={spec.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMatSpec(spec.id)}
              className={[
                'flex flex-col items-start rounded-xl border px-3.5 py-3 text-left transition',
                large ? 'col-span-2' : '',
                active
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50',
              ].join(' ')}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span
                  className={`text-sm font-semibold ${active ? 'text-brand-700' : 'text-stone-900'}`}
                >
                  {spec.label}
                  <span className="ml-1 text-xs font-normal text-stone-400">mm</span>
                </span>
                {large && (
                  <span className="rounded-full bg-stone-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    대형
                  </span>
                )}
              </span>
              <span className="mt-1 text-xs text-stone-500">{areaM2.toFixed(2)} m²</span>
            </button>
          )
        })}

        <div
          className={[
            'col-span-2 rounded-xl border px-3.5 py-3 transition',
            matSpecId === 'mat-custom'
              ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
              : 'border-stone-200 bg-white',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-stone-900">직접 입력</span>
            <span className="text-[11px] text-stone-400">
              {CUSTOM_SIZE_MIN_MM}–{CUSTOM_SIZE_MAX_MM} mm · 10cm 단위
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={CUSTOM_SIZE_MIN_MM}
              max={CUSTOM_SIZE_MAX_MM}
              step={100}
              value={customDraft}
              aria-label="매트 한 변 길이(mm)"
              onFocus={() => {
                if (matSpecId !== 'mat-custom') setMatSpec('mat-custom')
              }}
              onChange={(e) => setCustomDraft(e.target.value)}
              onBlur={commitCustom}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitCustom()
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-brand-500"
            />
            <span className="shrink-0 text-xs text-stone-500">mm</span>
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            {(() => {
              const size = normalizeCustomSize(Number(customDraft) || customSize)
              const area = (size * size) / 1_000_000
              return `한 장 ${area.toFixed(2)} m²`
            })()}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-stone-500">배치 기준</p>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
          {MODES.map((m) => {
            const active = tilingMode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTilingMode(m.id)}
                aria-pressed={active}
                title={m.hint}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800',
                ].join(' ')}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

    </PanelCard>
  )
}
