import { Analytics } from '@vercel/analytics/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useFloorPlanStore } from './store/useFloorPlanStore'

if (import.meta.env.DEV) {
  // 개발 중 콘솔/테스트에서 상태를 확인하기 위한 노출
  ;(window as unknown as { __floorPlanStore: typeof useFloorPlanStore }).__floorPlanStore =
    useFloorPlanStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
