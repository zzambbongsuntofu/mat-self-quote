import type { Tile } from '@/types'

const krw = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat('ko-KR')

/** 12000 → "₩12,000" */
export const formatKRW = (value: number) => krw.format(value)

/** 12000 → "12,000" */
export const formatNumber = (value: number) => num.format(value)

/** 12.345 → "12.35" (m² 표기용) */
export const formatArea = (m2: number) => m2.toFixed(2)

/** 소수점 뒤 불필요한 0 제거: 3.50 → "3.5", 3.00 → "3" */
const trimZeros = (s: string) => s.replace(/\.?0+$/, '')

/**
 * 길이(mm) → "350cm (3.5m)" / "80cm"
 * 1m 이상이면 미터 표기를 함께 보여준다.
 */
export const formatLength = (mm: number) => {
  const cm = trimZeros((mm / 10).toFixed(1))
  if (mm < 1000) return `${cm}cm`
  const m = trimZeros((mm / 1000).toFixed(2))
  return `${cm}cm (${m}m)`
}

const PIECE_SUFFIX = 'abcdefghijklmnopqrstuvwxyz'

/** 매트 번호 라벨: 온장은 "12", 절단 조각은 "12a" (같은 매트에서 재단) */
export const tileLabel = (t: Tile) =>
  t.full ? String(t.matNo) : `${t.matNo}${PIECE_SUFFIX[t.pieceIndex ?? 0] ?? ''}`
