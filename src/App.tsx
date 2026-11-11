import { AppHeader } from '@/components/layout/AppHeader'
import { CanvasPane } from '@/components/layout/CanvasPane'
import { ControlPanel } from '@/components/layout/ControlPanel'

export default function App() {
  return (
    <>
      <div className="flex h-full min-w-[1024px] flex-col">
        <AppHeader />
        <main className="flex min-h-0 flex-1">
          <CanvasPane />
          <ControlPanel />
        </main>
      </div>
      <p className="fixed inset-x-4 bottom-4 z-40 rounded-full bg-stone-900/90 px-4 py-2 text-center text-xs text-white shadow-lg min-[1024px]:hidden">
        도면 편집은 PC 화면에서 봐 주세요
      </p>
    </>
  )
}
