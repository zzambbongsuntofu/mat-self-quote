import { useEffect } from 'react'

interface AboutModalProps {
  onClose: () => void
}

export function AboutModal({ onClose }: AboutModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="about-title" className="text-base font-semibold text-stone-900">
            왜 만들었나요
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          층간소음매트 시공을 업체를 통해서 하게 되었는데 정말 하나하나 재단을 하는 과정으로
          하루를 잡아먹더라구요. 그래서 뭔가 미리 내 공간을 정확하게 알고 있다면 시간을 많이
          절약할수 있지 않을까 생각이 들어서 만들게 되었어요.
        </p>
      </div>
    </div>
  )
}
