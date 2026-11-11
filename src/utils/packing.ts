/**
 * 절단 조각 재단(빈 패킹) 유틸.
 *
 * 정사각형 매트(size × size)에서 직사각형 조각들을 몇 장으로 재단할 수 있는지
 * MaxRects(최대 빈 사각형 추적) + Best Short Side Fit 휴리스틱으로 계산한다.
 * 선반 방식과 달리 자투리 공간을 모두 후보로 유지하므로 작은 조각이 빈틈에 들어간다.
 * 90° 회전을 허용한다.
 */

export interface PackInput {
  id: string
  width: number
  height: number
}

export interface PackPlacement {
  id: string
  /** 몇 번째 매트(0부터) */
  bin: number
  /** 그 매트 안에서의 순번 (0부터) */
  index: number
  /** 매트 좌상단 기준 위치/크기 (회전 반영된 실제 크기) */
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
}

interface FreeRect {
  x: number
  y: number
  w: number
  h: number
}

interface Bin {
  free: FreeRect[]
  count: number
}

interface Candidate {
  bin: number
  rect: FreeRect
  w: number
  h: number
  rotated: boolean
  /** 1차 점수: 짧은 변 여유 (작을수록 좋음) */
  shortSide: number
  /** 2차 점수: 긴 변 여유 */
  longSide: number
}

const contains = (a: FreeRect, b: FreeRect) =>
  b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h

const overlaps = (a: FreeRect, b: FreeRect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

/** 배치된 사각형으로 모든 겹치는 빈 사각형을 분할 */
const splitFree = (free: FreeRect[], placed: FreeRect): FreeRect[] => {
  const next: FreeRect[] = []
  for (const f of free) {
    if (!overlaps(f, placed)) {
      next.push(f)
      continue
    }
    // 위
    if (placed.y > f.y) next.push({ x: f.x, y: f.y, w: f.w, h: placed.y - f.y })
    // 아래
    if (placed.y + placed.h < f.y + f.h) {
      next.push({ x: f.x, y: placed.y + placed.h, w: f.w, h: f.y + f.h - (placed.y + placed.h) })
    }
    // 왼쪽
    if (placed.x > f.x) next.push({ x: f.x, y: f.y, w: placed.x - f.x, h: f.h })
    // 오른쪽
    if (placed.x + placed.w < f.x + f.w) {
      next.push({ x: placed.x + placed.w, y: f.y, w: f.x + f.w - (placed.x + placed.w), h: f.h })
    }
  }
  // 다른 사각형에 완전히 포함되는 것 제거 (동일한 사각형은 앞의 것 하나만 유지)
  return next.filter((a, i) =>
    !next.some((b, j) => {
      if (i === j || !contains(b, a)) return false
      const identical = contains(a, b)
      return !identical || j < i
    }),
  )
}

const findCandidate = (bin: Bin, binIdx: number, w: number, h: number, rotated: boolean): Candidate | null => {
  let best: Candidate | null = null
  for (const rect of bin.free) {
    if (w > rect.w || h > rect.h) continue
    const dw = rect.w - w
    const dh = rect.h - h
    const shortSide = Math.min(dw, dh)
    const longSide = Math.max(dw, dh)
    if (!best || shortSide < best.shortSide || (shortSide === best.shortSide && longSide < best.longSide)) {
      best = { bin: binIdx, rect, w, h, rotated, shortSide, longSide }
    }
  }
  return best
}

const better = (a: Candidate, b: Candidate | null) =>
  !b || a.shortSide < b.shortSide || (a.shortSide === b.shortSide && a.longSide < b.longSide)

/**
 * 조각 목록을 매트에 재단한다.
 * 큰 조각(면적 → 긴 변 순)부터 배치하고, 기존 매트에 들어갈 수 있으면 새 매트를 열지 않는다.
 */
export const packPieces = (pieces: PackInput[], size: number): PackPlacement[] => {
  const sorted = [...pieces].sort(
    (a, b) =>
      b.width * b.height - a.width * a.height ||
      Math.max(b.width, b.height) - Math.max(a.width, a.height),
  )

  const bins: Bin[] = []
  const result: PackPlacement[] = []

  for (const piece of sorted) {
    let best: Candidate | null = null
    for (let b = 0; b < bins.length; b++) {
      const c1 = findCandidate(bins[b], b, piece.width, piece.height, false)
      if (c1 && better(c1, best)) best = c1
      if (piece.width !== piece.height) {
        const c2 = findCandidate(bins[b], b, piece.height, piece.width, true)
        if (c2 && better(c2, best)) best = c2
      }
    }

    if (!best) {
      bins.push({ free: [{ x: 0, y: 0, w: size, h: size }], count: 0 })
      const b = bins.length - 1
      const rotated = piece.width > piece.height
      const w = rotated ? piece.height : piece.width
      const h = rotated ? piece.width : piece.height
      best = findCandidate(bins[b], b, w, h, rotated)
      if (!best) continue // 매트보다 큰 조각 (발생하지 않음)
    }

    const bin = bins[best.bin]
    const placed: FreeRect = { x: best.rect.x, y: best.rect.y, w: best.w, h: best.h }
    bin.free = splitFree(bin.free, placed)
    result.push({
      id: piece.id,
      bin: best.bin,
      index: bin.count++,
      x: placed.x,
      y: placed.y,
      width: placed.w,
      height: placed.h,
      rotated: best.rotated,
    })
  }

  return result
}

/** 필요한 매트 수 */
export const countBins = (placements: PackPlacement[]): number =>
  placements.length === 0 ? 0 : Math.max(...placements.map((p) => p.bin)) + 1
