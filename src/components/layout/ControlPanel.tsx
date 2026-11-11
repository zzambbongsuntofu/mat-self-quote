import { MatSpecSelector } from '@/components/panel/MatSpecSelector'
import { RoomList } from '@/components/panel/RoomList'
import { CutPlanList } from '@/components/panel/CutPlanList'
import { QuoteSummary } from '@/components/panel/QuoteSummary'

/**
 * 우측 설정/결과 패널.
 * - 상단: 스크롤 가능한 설정 영역 (규격, 공간 목록)
 * - 하단: 항상 보이는 견적 요약
 */
export function ControlPanel() {
  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-stone-200 bg-stone-50">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 pb-4">
        <MatSpecSelector />
        <RoomList />
        <CutPlanList />
      </div>
      <div className="shrink-0 border-t border-stone-200 p-6 pt-4">
        <QuoteSummary />
      </div>
    </aside>
  )
}
