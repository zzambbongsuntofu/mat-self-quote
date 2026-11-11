import type { Point } from '@/types'
import { GRID_UNIT_MM } from '@/constants'

/**
 * 평형 프리셋: 평수에 해당하는 면적의 직사각형 하나를 만든다.
 * 1평 = 3.3058 m². 가로:세로 ≈ 1:1.3 비율로 잡고 10cm 단위로 맞춘다.
 */

export const M2_PER_PYEONG = 3.3058

export interface FloorPlanPreset {
  id: string
  label: string
  pyeong: number
  /** 생성될 사각형 (mm) */
  width: number
  height: number
  /** 실제 생성 면적 (m²) */
  areaM2: number
  points: Point[]
}

const snapGrid = (mm: number) => Math.round(mm / GRID_UNIT_MM) * GRID_UNIT_MM

const makePreset = (pyeong: number): FloorPlanPreset => {
  const areaMm2 = pyeong * M2_PER_PYEONG * 1_000_000
  const width = snapGrid(Math.sqrt(areaMm2 / 1.3))
  const height = snapGrid(areaMm2 / width)
  return {
    id: `py${pyeong}`,
    label: `${pyeong}평`,
    pyeong,
    width,
    height,
    areaM2: (width * height) / 1_000_000,
    points: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
  }
}

export const FLOOR_PLAN_PRESETS: FloorPlanPreset[] = [10, 15, 20, 25, 30, 35, 40].map(makePreset)
