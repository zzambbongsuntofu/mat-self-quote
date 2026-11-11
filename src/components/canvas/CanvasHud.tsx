import type { ToolMode } from '@/types'

interface CanvasHudProps {
  scale: number
  tool: ToolMode
  isDrawing: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  /** 도면 전체 보기 (공간이 없으면 undefined) */
  onFit?: () => void
}

const btn =
  'flex size-8 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 hover:text-stone-900'

const hintFor = (tool: ToolMode, isDrawing: boolean) => {
  if (tool === 'draw') {
    return isDrawing
      ? '클릭 다음 모서리 · 시작점 클릭 / Enter / 더블클릭 닫기 · Backspace 한 점 취소 · Esc 취소'
      : '클릭하여 첫 모서리 찍기 · 휠 줌 · Shift+휠 / 가운데 버튼 이동'
  }
  return '클릭 선택 · 드래그 이동 · ○ 꼭짓점 / □ 벽 이동 · Delete 삭제 · 휠 줌'
}

/** 캔버스 좌하단 조작 안내 + 우하단 줌 컨트롤 */
export function CanvasHud({ scale, tool, isDrawing, onZoomIn, onZoomOut, onReset, onFit }: CanvasHudProps) {
  const percent = Math.round((scale / 0.1) * 100)

  return (
    <>
      <div className="pointer-events-none absolute bottom-4 left-4 max-w-[70%] rounded-lg bg-white/90 px-3 py-1.5 text-[11px] text-stone-500 shadow-sm ring-1 ring-stone-200 backdrop-blur-sm">
        {hintFor(tool, isDrawing)}
      </div>

      <div className="absolute right-4 bottom-4 flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-sm ring-1 ring-stone-200">
        <button
          type="button"
          onClick={onFit}
          disabled={!onFit}
          className={`${btn} disabled:cursor-not-allowed disabled:opacity-30`}
          aria-label="도면 전체 보기"
          title="도면 전체 보기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
        <span className="mx-0.5 h-5 w-px bg-stone-200" />
        <button type="button" onClick={onZoomOut} className={btn} aria-label="축소">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="min-w-14 rounded-lg px-2 py-1 text-xs font-medium tabular-nums text-stone-700 transition hover:bg-stone-100"
          title="보기 초기화"
        >
          {percent}%
        </button>
        <button type="button" onClick={onZoomIn} className={btn} aria-label="확대">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </>
  )
}
