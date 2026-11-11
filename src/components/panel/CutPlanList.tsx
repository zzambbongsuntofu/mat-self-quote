import { useState } from 'react'
import type { CutMatPlan } from '@/types'
import { resolveMatSpec, TILE_STYLE } from '@/constants'
import { useFloorPlanStore } from '@/store/useFloorPlanStore'
import { PanelCard } from './PanelCard'

const SUFFIX = 'abcdefghijklmnopqrstuvwxyz'
const PREVIEW = 6

/** 재단용 매트 한 장의 미니 재단도 */
function CutMatDiagram({ plan, size }: { plan: CutMatPlan; size: number }) {
  const px = 88
  const k = px / size
  return (
    <div className="flex gap-3 rounded-xl border border-stone-200 bg-white p-3">
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        className="shrink-0 rounded-md"
        role="img"
        aria-label={`${plan.matNo}번 매트 재단도`}
      >
        <rect width={px} height={px} fill="#f5f5f4" stroke="#1c1917" strokeWidth={1.5} rx={3} />
        {plan.pieces.map((p) => (
          <g key={p.tileId}>
            <rect
              x={p.x * k}
              y={p.y * k}
              width={p.width * k}
              height={p.height * k}
              fill={TILE_STYLE.cut.color}
              stroke="#a16207"
              strokeWidth={1}
              strokeDasharray="2 1.5"
            />
            {p.width * k >= 12 && p.height * k >= 10 && (
              <text
                x={(p.x + p.width / 2) * k}
                y={(p.y + p.height / 2) * k}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.max(7, Math.min(11, Math.min(p.width, p.height) * k * 0.5))}
                fontWeight={600}
                fill="#713f12"
              >
                {SUFFIX[p.pieceIndex]}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-900">{plan.matNo}번 매트</p>
          <span className="text-[11px] text-stone-500">
            활용 {Math.round(plan.utilization * 100)}%
          </span>
        </div>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {plan.pieces.map((p) => (
            <li key={p.tileId} className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="inline-flex size-4 items-center justify-center rounded bg-amber-100 text-[10px] font-semibold text-amber-800">
                {SUFFIX[p.pieceIndex]}
              </span>
              <span className="tabular-nums">
                {(p.rotated ? p.height : p.width) / 10} × {(p.rotated ? p.width : p.height) / 10} cm
              </span>
              {p.rotated && <span className="text-[10px] text-stone-400">회전</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** 절단 조각을 어느 매트에서 어떻게 잘라내는지 보여주는 목록 */
export function CutPlanList() {
  const quote = useFloorPlanStore((s) => s.quote)
  const size = useFloorPlanStore((s) => resolveMatSpec(s.matSpecId, s.customSize).size)
  const [expanded, setExpanded] = useState(false)

  if (!quote || quote.cutPlan.length === 0) return null

  const plans = expanded ? quote.cutPlan : quote.cutPlan.slice(0, PREVIEW)
  const hidden = quote.cutPlan.length - plans.length

  return (
    <PanelCard
      title="재단 계획"
      description="도면의 조각 번호(예: 51a)는 아래 매트 번호와 조각 기호에 대응합니다"
      action={
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
          {quote.cutMats}장
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        {plans.map((plan) => (
          <CutMatDiagram key={plan.matNo} plan={plan} size={size} />
        ))}
      </div>
      {(hidden > 0 || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full rounded-xl border border-stone-200 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
        >
          {expanded ? '접기' : `${hidden}장 더 보기`}
        </button>
      )}
    </PanelCard>
  )
}
