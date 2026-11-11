import type { ReactNode } from 'react'

interface PanelCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** 우측 패널 공통 카드 컨테이너 */
export function PanelCard({
  title,
  description,
  action,
  children,
  className = '',
}: PanelCardProps) {
  return (
    <section
      className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-stone-500">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
