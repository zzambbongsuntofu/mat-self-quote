import { resolveMatSpec, TILE_STYLE } from '@/constants'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import { formatArea, formatNumber } from '@/utils/format'
import { PanelCard } from './PanelCard'

/** 온장 / 절단 조각 요약 + 총 견적 */
export function QuoteSummary() {
  const quote = useFloorPlanStore((s) => s.quote)
  const dirty = useFloorPlanStore((s) => s.tilingDirty)
  const matSpec = useFloorPlanStore((s) => resolveMatSpec(s.matSpecId, s.customSize))

  const lossRatio =
    quote && quote.purchasedM2 > 0
      ? Math.max(0, (quote.purchasedM2 - quote.areaM2) / quote.purchasedM2)
      : 0
  const lossText =
    lossRatio < 0.005
      ? '자투리 재활용을 반영한 수량으로 로스는 거의 없습니다.'
      : `자투리 재활용을 반영한 수량으로 로스는 약 ${Math.round(lossRatio * 100)}% 입니다.`

  return (
    <PanelCard
      title="필요 수량"
      description={`${matSpec.label} mm`}
      action={
        dirty ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            재배치 필요
          </span>
        ) : undefined
      }
    >
      <ul className="flex flex-col divide-y divide-stone-100">
        <li className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <span
              className="size-3.5 shrink-0 rounded-sm border border-black/10"
              style={{ backgroundColor: TILE_STYLE.full.color }}
            />
            <div>
              <p className="text-sm font-medium text-stone-900">{TILE_STYLE.full.label}</p>
              <p className="text-xs text-stone-500">{TILE_STYLE.full.description}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-stone-900">
            {quote ? `${formatNumber(quote.fullMats)}장` : '—'}
          </p>
        </li>
        <li className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <span
              className="size-3.5 shrink-0 rounded-sm border border-dashed border-amber-700/60"
              style={{ backgroundColor: TILE_STYLE.cut.color }}
            />
            <div>
              <p className="text-sm font-medium text-stone-900">{TILE_STYLE.cut.label}</p>
              <p className="text-xs text-stone-500">{TILE_STYLE.cut.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-stone-900">
              {quote ? `${formatNumber(quote.cutMats)}장` : '—'}
            </p>
            <p className="text-xs text-stone-500">
              {quote ? `조각 ${formatNumber(quote.cutPieces)}개` : '배치 전'}
            </p>
          </div>
        </li>
      </ul>

      {quote ? (
        <div className="mt-3 rounded-xl bg-stone-900 p-4 text-white">
          <p className="text-xs text-stone-400">필요한 매트</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {formatNumber(quote.totalMats)}장이 필요합니다
          </p>
          <p className="mt-2 text-xs text-stone-400">
            시공 {formatArea(quote.areaM2)} m² · 구매 {formatArea(quote.purchasedM2)} m²
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
            {lossText} 시공 중 실수에 대비해 1~2장 여유분을 권장합니다.
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-stone-100 px-4 py-5">
          <p className="text-sm font-medium text-stone-700">아직 계산 전입니다</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            공간을 그린 뒤 매트 배치하기를 누르면 필요한 장수가 여기에 나옵니다.
          </p>
        </div>
      )}
    </PanelCard>
  )
}
