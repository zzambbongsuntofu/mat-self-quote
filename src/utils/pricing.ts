import type { MatSpec, Quote } from '@/types'
import type { TilingResult } from './tiling'

/** 타일링 결과 + 매트 규격 → 견적 */
export const buildQuote = (result: TilingResult, spec: MatSpec): Quote => {
  const totalMats = result.fullMats + result.cutMats
  return {
    fullMats: result.fullMats,
    cutPieces: result.cutPieces,
    cutMats: result.cutMats,
    totalMats,
    areaM2: result.areaMm2 / 1_000_000,
    purchasedM2: (totalMats * spec.size * spec.size) / 1_000_000,
    unitPrice: spec.unitPrice,
    total: totalMats * spec.unitPrice,
    cutPlan: result.cutPlan,
  }
}
