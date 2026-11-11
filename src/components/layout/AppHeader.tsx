import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { AboutModal } from './AboutModal'

/** 화면과 저장 이미지에 함께 찍히는 제작자 표기 */
const CREATOR_NAME = '창의력 대마왕'
const CONTACT_EMAIL = 'ggazuaa@gmail.com'

const pad = (value: number) => String(value).padStart(2, '0')

/** 매트견적_26년11월11일23시52분.png */
const quoteFileName = (date = new Date()) => {
  const yy = pad(date.getFullYear() % 100)
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  return `매트견적_${yy}년${month}월${day}일${hour}시${minute}분.png`
}

export function AppHeader() {
  const saving = useRef(false)
  const [saved, setSaved] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  const saveScreen = async () => {
    const root = document.getElementById('root')
    if (!root || saving.current) return
    saving.current = true
    try {
      const dataUrl = await toPng(root, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#fafaf9',
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = quoteFileName()
      link.click()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1600)
    } catch {
      window.alert('화면을 이미지로 저장하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      saving.current = false
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-8">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-stone-900">
            층간소음 셀프시공 견적
          </h1>
          <p className="text-xs text-stone-500">평면도 그려 필요한 매트 장수 산출</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-stone-500">제작자: {CREATOR_NAME}</span>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-sm text-stone-500 transition hover:text-stone-900"
        >
          이메일: {CONTACT_EMAIL}
        </a>
        <button
          type="button"
          onClick={saveScreen}
          className="rounded-lg bg-stone-900 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          {saved ? '저장됨' : '견적서 저장'}
        </button>
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          aria-label="왜 만들었는지 보기"
          className="flex size-8 items-center justify-center rounded-full border border-stone-300 text-sm font-semibold text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
        >
          ?
        </button>
      </div>
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </header>
  )
}
