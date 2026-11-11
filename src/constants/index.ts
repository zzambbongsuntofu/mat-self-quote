import type { MatSpec, PresetMatSpecId } from '@/types'

/** Grid Snap 단위 (10cm) */
export const GRID_UNIT_MM = 100

/** 캔버스 기본 스케일: 1mm 당 px (0.1 → 10cm = 10px) */
export const DEFAULT_SCALE = 0.1

/**
 * 매트 규격 프리셋.
 * 단가는 면적에 비례하되 대형일수록 m²당 단가가 조금 낮아지도록 잡았다.
 * 한 변은 모두 10cm 격자 배수여야 타일링이 맞는다.
 */
/** 이 크기 이상은 대형으로 표시하고 선택 칸을 두 칸 쓴다 */
export const LARGE_MAT_MM = 1000

/** 직접 입력 가능한 한 변 범위 (10cm 단위) */
export const CUSTOM_SIZE_MIN_MM = 400
export const CUSTOM_SIZE_MAX_MM = 2000

export const MAT_SPECS: Record<PresetMatSpecId, MatSpec> = {
  'mat-500': {
    id: 'mat-500',
    label: '500 × 500',
    size: 500,
    unitPrice: 12_000,
  },
  'mat-600': {
    id: 'mat-600',
    label: '600 × 600',
    size: 600,
    unitPrice: 16_000,
  },
  'mat-800': {
    id: 'mat-800',
    label: '800 × 800',
    size: 800,
    unitPrice: 28_000,
  },
  'mat-1000': {
    id: 'mat-1000',
    label: '1000 × 1000',
    size: 1000,
    unitPrice: 42_000,
  },
  'mat-1200': {
    id: 'mat-1200',
    label: '1200 × 1200',
    size: 1200,
    unitPrice: 58_000,
  },
}

export const MAT_SPEC_LIST: MatSpec[] = Object.values(MAT_SPECS)

/** 큰 규격이 앞에 오도록 정렬 */
export const MAT_SPEC_LIST_DESC: MatSpec[] = [...MAT_SPEC_LIST].sort((a, b) => b.size - a.size)

/**
 * 한 변 길이(mm)에 대한 장당 단가.
 * 소형은 m²당 약 4.8만 원, 대형은 약 4만 원으로 완만히 낮아진다.
 */
export const unitPriceForSize = (sizeMm: number): number => {
  const area = (sizeMm * sizeMm) / 1_000_000
  const perM2 = Math.min(50_000, Math.max(38_000, 50_000 - area * 6_000))
  return Math.round((area * perM2) / 1_000) * 1_000
}

/** 직접 입력값을 10cm 단위, 허용 범위 안으로 맞춘다 */
export const normalizeCustomSize = (mm: number): number => {
  if (!Number.isFinite(mm)) return CUSTOM_SIZE_MIN_MM
  const snapped = Math.round(mm / GRID_UNIT_MM) * GRID_UNIT_MM
  return Math.min(CUSTOM_SIZE_MAX_MM, Math.max(CUSTOM_SIZE_MIN_MM, snapped))
}

/** 프리셋 또는 직접 입력 크기를 실제 규격으로 푼다 */
export const resolveMatSpec = (
  id: MatSpec['id'],
  customSizeMm: number,
): MatSpec => {
  if (id === 'mat-custom') {
    const size = normalizeCustomSize(customSizeMm)
    return {
      id,
      label: `${size} × ${size}`,
      size,
      unitPrice: unitPriceForSize(size),
    }
  }
  return MAT_SPECS[id]
}

/** 온장 / 절단 조각 표시 스타일 */
export const TILE_STYLE = {
  full: {
    label: '온장',
    description: '자르지 않고 그대로 놓는 매트',
    color: '#a8c5e2',
  },
  cut: {
    label: '절단 조각',
    description: '경계에 맞춰 잘라 쓰는 조각. 같은 번호끼리 한 장에서 재단',
    color: '#f4c07a',
  },
} as const
