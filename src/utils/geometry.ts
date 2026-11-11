import type { Point, Rect } from '@/types'
import { GRID_UNIT_MM } from '@/constants'

/**
 * 2D 기하 유틸리티 (순수 함수, mm 단위)
 * - 렌더링(px) 변환은 mmToPx / pxToMm 만 담당하고 나머지는 전부 mm 기준.
 */

/** 값을 그리드 단위로 스냅 */
export const snap = (value: number, unit: number = GRID_UNIT_MM): number =>
  Math.round(value / unit) * unit

/** 점을 그리드에 스냅 */
export const snapPoint = (p: Point, unit: number = GRID_UNIT_MM): Point => ({
  x: snap(p.x, unit),
  y: snap(p.y, unit),
})

/** mm → px */
export const mmToPx = (mm: number, scale: number): number => mm * scale

/** px → mm */
export const pxToMm = (px: number, scale: number): number => px / scale

/** 두 점으로부터 정규화된 직사각형 생성 (드래그 방향 무관, width/height ≥ 0) */
export const rectFromPoints = (a: Point, b: Point): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
})

/** 음수 크기를 가진 사각형을 정규화 */
export const normalizeRect = (r: Rect): Rect =>
  rectFromPoints({ x: r.x, y: r.y }, { x: r.x + r.width, y: r.y + r.height })

/** 사각형의 각 변/위치를 그리드에 스냅 (좌표를 스냅 후 크기 재계산) */
export const snapRect = (r: Rect, unit: number = GRID_UNIT_MM): Rect => {
  const n = normalizeRect(r)
  const x1 = snap(n.x, unit)
  const y1 = snap(n.y, unit)
  const x2 = snap(n.x + n.width, unit)
  const y2 = snap(n.y + n.height, unit)
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}

/** 면적 (mm²) */
export const rectArea = (r: Rect): number => r.width * r.height

/** mm² → m² */
export const mm2ToM2 = (mm2: number): number => mm2 / 1_000_000

/** 점이 사각형 내부(경계 포함)에 있는지 */
export const containsPoint = (r: Rect, p: Point): boolean =>
  p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height

/** 두 사각형이 겹치는지 (경계만 닿는 경우 false) */
export const rectsOverlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

// ─────────────────────────────────────────────────────────────────
// 직교 폴리곤 (rectilinear polygon)
// ─────────────────────────────────────────────────────────────────

export const pointsEqual = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y

/** 두 점을 잇는 변이 수평인지 */
export const isHorizontal = (a: Point, b: Point): boolean => a.y === b.y

/** 변 길이 (mm) — 직교 변 기준 맨해튼 거리 */
export const edgeLength = (a: Point, b: Point): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

/**
 * from 기준으로 to 를 수평 또는 수직 방향으로 투영한 뒤 그리드에 스냅.
 * 더 많이 움직인 축을 따른다.
 */
export const orthoSnap = (from: Point, to: Point, unit: number = GRID_UNIT_MM): Point => {
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  return dx >= dy
    ? { x: snap(to.x, unit), y: from.y }
    : { x: from.x, y: snap(to.y, unit) }
}

/** 연속 중복점 및 일직선상의 중간점 제거 */
export const simplifyOrthoPolygon = (points: Point[]): Point[] => {
  // 1) 연속 중복 제거 (닫힌 폴리곤이므로 마지막↔첫 점도 비교)
  const dedup: Point[] = []
  for (const p of points) {
    if (dedup.length === 0 || !pointsEqual(dedup[dedup.length - 1], p)) dedup.push(p)
  }
  while (dedup.length > 1 && pointsEqual(dedup[0], dedup[dedup.length - 1])) dedup.pop()
  if (dedup.length < 3) return dedup

  // 2) 일직선상의 점 제거
  const result: Point[] = []
  const n = dedup.length
  for (let i = 0; i < n; i++) {
    const prev = dedup[(i - 1 + n) % n]
    const cur = dedup[i]
    const next = dedup[(i + 1) % n]
    const collinear =
      (prev.x === cur.x && cur.x === next.x) || (prev.y === cur.y && cur.y === next.y)
    if (!collinear) result.push(cur)
  }
  return result
}

/** 두 축 정렬 선분이 교차(또는 겹침)하는지. 끝점만 공유하는 경우는 제외. */
const axisSegmentsIntersect = (a1: Point, a2: Point, b1: Point, b2: Point): boolean => {
  const ax1 = Math.min(a1.x, a2.x)
  const ax2 = Math.max(a1.x, a2.x)
  const ay1 = Math.min(a1.y, a2.y)
  const ay2 = Math.max(a1.y, a2.y)
  const bx1 = Math.min(b1.x, b2.x)
  const bx2 = Math.max(b1.x, b2.x)
  const by1 = Math.min(b1.y, b2.y)
  const by2 = Math.max(b1.y, b2.y)
  const overlapX = ax1 <= bx2 && bx1 <= ax2
  const overlapY = ay1 <= by2 && by1 <= ay2
  if (!(overlapX && overlapY)) return false
  // 바운딩 박스가 겹치면 축 정렬 선분은 실제로 만난다.
  // 단, 한 점에서만 닿는 경우(ㄱ자 접촉)는 교차로 보지 않는다.
  const touchX = ax1 === bx2 || bx1 === ax2
  const touchY = ay1 === by2 || by1 === ay2
  const aIsPoint = ax1 === ax2 && ay1 === ay2
  const bIsPoint = bx1 === bx2 && by1 === by2
  if (aIsPoint || bIsPoint) return false
  return !(touchX && touchY)
}

/** 직교 폴리곤이 자기 교차 없이 단순(simple)한지 */
export const isSimpleOrthoPolygon = (points: Point[]): boolean => {
  const n = points.length
  if (n < 4) return false
  for (let i = 0; i < n; i++) {
    const a1 = points[i]
    const a2 = points[(i + 1) % n]
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue // 인접 변 (마지막↔첫)
      const b1 = points[j]
      const b2 = points[(j + 1) % n]
      if (axisSegmentsIntersect(a1, a2, b1, b2)) return false
    }
  }
  return true
}

/**
 * 그리는 중인 꼭짓점 목록을 직교 폴리곤으로 닫는다.
 * 마지막 점과 첫 점이 같은 축에 있지 않으면 코너 점을 하나 삽입하는데,
 * 두 후보 중 자기 교차가 생기지 않는 쪽을 고른다.
 * 유효하지 않으면 null.
 */
export const closeOrthoPolygon = (points: Point[]): Point[] | null => {
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]

  const candidates: Point[][] = []
  if (pointsEqual(first, last) || first.x === last.x || first.y === last.y) {
    candidates.push([...points])
  } else {
    candidates.push([...points, { x: first.x, y: last.y }])
    candidates.push([...points, { x: last.x, y: first.y }])
  }

  let fallback: Point[] | null = null
  for (const c of candidates) {
    const simplified = simplifyOrthoPolygon(c)
    if (simplified.length < 4 || polygonArea(simplified) <= 0) continue
    if (isSimpleOrthoPolygon(simplified)) return simplified
    fallback ??= simplified
  }
  return fallback
}

/** 폴리곤 면적 (mm², 신발끈 공식, 절댓값) */
export const polygonArea = (points: Point[]): number => {
  let sum = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const a = points[i]
    const b = points[(i + 1) % n]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

/** 폴리곤 둘레 (mm) */
export const polygonPerimeter = (points: Point[]): number => {
  let sum = 0
  const n = points.length
  for (let i = 0; i < n; i++) sum += edgeLength(points[i], points[(i + 1) % n])
  return sum
}

/** 폴리곤 바운딩 박스 */
export const polygonBBox = (points: Point[]): Rect | null => {
  if (points.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** 폴리곤 무게중심 (라벨 배치용) */
export const polygonCentroid = (points: Point[]): Point => {
  const n = points.length
  let cx = 0
  let cy = 0
  let a = 0
  for (let i = 0; i < n; i++) {
    const p = points[i]
    const q = points[(i + 1) % n]
    const cross = p.x * q.y - q.x * p.y
    a += cross
    cx += (p.x + q.x) * cross
    cy += (p.y + q.y) * cross
  }
  if (a === 0) {
    const b = polygonBBox(points)!
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  }
  a /= 2
  return { x: cx / (6 * a), y: cy / (6 * a) }
}

/** 폴리곤 평행 이동 */
export const translatePolygon = (points: Point[], dx: number, dy: number): Point[] =>
  points.map((p) => ({ x: p.x + dx, y: p.y + dy }))

/**
 * 꼭짓점 i 를 next 위치로 옮기면서 인접 변의 직교성을 유지한다.
 * - 이전 변이 수평이면 이전 점의 y 를, 수직이면 x 를 따라 움직인다.
 * - 다음 변도 동일.
 */
export const moveOrthoVertex = (points: Point[], i: number, next: Point): Point[] => {
  const n = points.length
  const pts = points.map((p) => ({ ...p }))
  const cur = points[i]
  const prevIdx = (i - 1 + n) % n
  const nextIdx = (i + 1) % n

  if (isHorizontal(points[prevIdx], cur)) pts[prevIdx].y = next.y
  else pts[prevIdx].x = next.x

  if (isHorizontal(cur, points[nextIdx])) pts[nextIdx].y = next.y
  else pts[nextIdx].x = next.x

  pts[i] = { ...next }
  return pts
}

/**
 * 변 (i → i+1) 을 수직 방향으로 평행 이동한다.
 * 수평 변이면 y 좌표를, 수직 변이면 x 좌표를 value 로 설정.
 */
export const moveOrthoEdge = (points: Point[], i: number, value: number): Point[] => {
  const n = points.length
  const j = (i + 1) % n
  const pts = points.map((p) => ({ ...p }))
  if (isHorizontal(points[i], points[j])) {
    pts[i].y = value
    pts[j].y = value
  } else {
    pts[i].x = value
    pts[j].x = value
  }
  return pts
}

/** 점이 폴리곤 내부에 있는지 (ray casting, 경계는 포함하지 않음) */
export const pointInPolygon = (points: Point[], p: Point): boolean => {
  let inside = false
  const n = points.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = points[i]
    const b = points[j]
    const intersects =
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    if (intersects) inside = !inside
  }
  return inside
}

/** 여러 사각형의 바운딩 박스 */
export const boundingBox = (rects: Rect[]): Rect | null => {
  if (rects.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const r of rects) {
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.width)
    maxY = Math.max(maxY, r.y + r.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
