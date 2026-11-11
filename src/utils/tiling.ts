import type { CutMatPlan, Point, Rect, Room, Tile } from '@/types'
import { GRID_UNIT_MM } from '@/constants'
import { boundingBox, pointInPolygon, polygonBBox, snap } from './geometry'
import { countBins, packPieces } from './packing'

/**
 * 배치 기준
 * - center : 영역 중심에서 바깥으로 확장 (양쪽 절단 조각이 대칭)
 * - economy: 벽에 붙여 시작하는 정렬도 후보에 넣어 총 매트 수가 가장 적은 쪽 선택
 */
export type TilingMode = 'center' | 'economy'

/**
 * 매트 자동 타일링.
 *
 * 1) 모든 공간을 10cm 셀 점유 맵(합집합)으로 변환한다.
 * 2) 도면 중심에서 바깥으로 확장되도록 타일 그리드를 정렬한다.
 *    (타일 모서리/중심을 도면 중심에 맞추는 4가지 정렬 중 절단 조각이 가장 적은 것을 선택)
 * 3) 각 타일 위치에서 점유 셀을 모아 온장(full) / 절단 조각(cut) 을 만든다.
 * 4) 온장은 좌상단부터 번호를 매기고, 절단 조각은 재단 패킹으로 매트 번호와 재단 위치를 부여한다.
 */

const CELL = GRID_UNIT_MM

interface OccupancyGrid {
  originX: number
  originY: number
  cols: number
  rows: number
  cells: Uint8Array
}

const buildOccupancy = (rooms: Room[]): OccupancyGrid | null => {
  const boxes = rooms.map((r) => polygonBBox(r.points)).filter((b): b is Rect => !!b)
  const bbox = boundingBox(boxes)
  if (!bbox || bbox.width <= 0 || bbox.height <= 0) return null

  const originX = Math.floor(bbox.x / CELL) * CELL
  const originY = Math.floor(bbox.y / CELL) * CELL
  const cols = Math.ceil((bbox.x + bbox.width - originX) / CELL)
  const rows = Math.ceil((bbox.y + bbox.height - originY) / CELL)
  const cells = new Uint8Array(cols * rows)

  for (let r = 0; r < rows; r++) {
    const cy = originY + r * CELL + CELL / 2
    for (let c = 0; c < cols; c++) {
      const p = { x: originX + c * CELL + CELL / 2, y: cy }
      for (const room of rooms) {
        if (pointInPolygon(room.points, p)) {
          cells[r * cols + c] = 1
          break
        }
      }
    }
  }
  return { originX, originY, cols, rows, cells }
}

const isOccupied = (g: OccupancyGrid, col: number, row: number): boolean => {
  if (col < 0 || row < 0 || col >= g.cols || row >= g.rows) return false
  return g.cells[row * g.cols + col] === 1
}

/** 벽으로 분리된 영역(연결 성분) 하나 */
interface Region {
  /** 이 영역에 속한 셀만 1 인 점유 맵 (원점/크기는 전체 그리드와 동일) */
  grid: OccupancyGrid
  /** 영역 셀의 바운딩 박스 (mm) */
  bbox: Rect
}

/** 4방향 flood fill 로 점유 셀을 연결 성분으로 나눈다 */
const splitRegions = (g: OccupancyGrid): Region[] => {
  const visited = new Uint8Array(g.cols * g.rows)
  const regions: Region[] = []
  const stack: number[] = []

  for (let start = 0; start < g.cells.length; start++) {
    if (g.cells[start] !== 1 || visited[start]) continue
    const cells = new Uint8Array(g.cols * g.rows)
    let minC = Infinity
    let minR = Infinity
    let maxC = -Infinity
    let maxR = -Infinity

    stack.push(start)
    visited[start] = 1
    while (stack.length) {
      const idx = stack.pop()!
      cells[idx] = 1
      const c = idx % g.cols
      const r = (idx - c) / g.cols
      minC = Math.min(minC, c)
      maxC = Math.max(maxC, c)
      minR = Math.min(minR, r)
      maxR = Math.max(maxR, r)
      const neighbors = [
        [c - 1, r],
        [c + 1, r],
        [c, r - 1],
        [c, r + 1],
      ]
      for (const [nc, nr] of neighbors) {
        if (!isOccupied(g, nc, nr)) continue
        const ni = nr * g.cols + nc
        if (visited[ni]) continue
        visited[ni] = 1
        stack.push(ni)
      }
    }

    regions.push({
      grid: { ...g, cells },
      bbox: {
        x: g.originX + minC * CELL,
        y: g.originY + minR * CELL,
        width: (maxC - minC + 1) * CELL,
        height: (maxR - minR + 1) * CELL,
      },
    })
  }
  return regions
}

const toCol = (g: OccupancyGrid, x: number) => Math.floor((x - g.originX) / CELL)
const toRow = (g: OccupancyGrid, y: number) => Math.floor((y - g.originY) / CELL)

interface RawPiece {
  rect: Rect
  full: boolean
  cells?: Point[]
}

/** 주어진 그리드 원점(gx, gy)으로 영역에 타일을 깔아 조각 목록 생성 */
const layoutPieces = (region: Region, size: number, gx: number, gy: number): RawPiece[] => {
  const g = region.grid
  const pieces: RawPiece[] = []
  const minX = region.bbox.x
  const minY = region.bbox.y
  const maxX = region.bbox.x + region.bbox.width
  const maxY = region.bbox.y + region.bbox.height
  const cellsPerSide = size / CELL
  const fullCellCount = cellsPerSide * cellsPerSide

  const kx0 = Math.floor((minX - gx) / size)
  const kx1 = Math.ceil((maxX - gx) / size) - 1
  const ky0 = Math.floor((minY - gy) / size)
  const ky1 = Math.ceil((maxY - gy) / size) - 1

  for (let ky = ky0; ky <= ky1; ky++) {
    for (let kx = kx0; kx <= kx1; kx++) {
      const tx = gx + kx * size
      const ty = gy + ky * size
      const occupied: Point[] = []
      let bx0 = Infinity
      let by0 = Infinity
      let bx1 = -Infinity
      let by1 = -Infinity

      for (let r = 0; r < cellsPerSide; r++) {
        for (let c = 0; c < cellsPerSide; c++) {
          const cx = tx + c * CELL
          const cy = ty + r * CELL
          if (isOccupied(g, toCol(g, cx), toRow(g, cy))) {
            occupied.push({ x: cx, y: cy })
            bx0 = Math.min(bx0, cx)
            by0 = Math.min(by0, cy)
            bx1 = Math.max(bx1, cx + CELL)
            by1 = Math.max(by1, cy + CELL)
          }
        }
      }
      if (occupied.length === 0) continue

      const rect: Rect = { x: bx0, y: by0, width: bx1 - bx0, height: by1 - by0 }
      const full = occupied.length === fullCellCount
      const bboxCells = (rect.width / CELL) * (rect.height / CELL)
      pieces.push({
        rect,
        full,
        cells: occupied.length === bboxCells ? undefined : occupied,
      })
    }
  }
  return pieces
}

export interface TilingResult {
  tiles: Tile[]
  fullMats: number
  cutPieces: number
  cutMats: number
  cutPlan: CutMatPlan[]
  /** 점유 면적 (mm²) */
  areaMm2: number
}

/**
 * 한 축에서 시도할 그리드 원점 후보.
 * 원점은 항상 10cm 격자 위다. 500mm 처럼 절반이 50mm 인 규격도
 * 벽선과 같은 선에 붙는다.
 */
const axisCandidates = (start: number, length: number, size: number, mode: TilingMode): number[] => {
  const center = snap(start + length / 2)
  const list = [center, snap(center - size / 2)] // 중심에 타일 모서리 / 타일 중심
  if (mode === 'economy') list.push(snap(start), snap(start + length)) // 벽에 붙여 시작
  return [...new Set(list)]
}

/** 배치안의 비용: 온장 + 절단 조각을 재단했을 때 필요한 매트 수 (작을수록 좋음) */
const layoutCost = (pieces: RawPiece[], size: number) => {
  const fulls = pieces.filter((p) => p.full).length
  const cuts = pieces.filter((p) => !p.full)
  const bins = countBins(
    packPieces(
      cuts.map((p, i) => ({ id: String(i), width: p.rect.width, height: p.rect.height })),
      size,
    ),
  )
  return { mats: fulls + bins, cuts: cuts.length }
}

/** 공간 목록과 매트 한 변 길이(mm)로 타일링을 수행한다. */
export const tileRooms = (rooms: Room[], size: number, mode: TilingMode = 'center'): TilingResult | null => {
  const g = buildOccupancy(rooms)
  if (!g) return null

  // 벽으로 분리된 영역마다 따로 배치 (각자의 중심 기준)
  const allPieces: RawPiece[] = []
  for (const region of splitRegions(g)) {
    const xs = axisCandidates(region.bbox.x, region.bbox.width, size, mode)
    const ys = axisCandidates(region.bbox.y, region.bbox.height, size, mode)

    let best: { pieces: RawPiece[]; mats: number; cuts: number } | null = null
    for (const gx of xs) {
      for (const gy of ys) {
        const pieces = layoutPieces(region, size, gx, gy)
        const { mats, cuts } = layoutCost(pieces, size)
        if (!best || mats < best.mats || (mats === best.mats && cuts < best.cuts)) {
          best = { pieces, mats, cuts }
        }
      }
    }
    if (best) allPieces.push(...best.pieces)
  }
  if (allPieces.length === 0) return null

  const byPosition = (a: RawPiece, b: RawPiece) => a.rect.y - b.rect.y || a.rect.x - b.rect.x
  const fulls = allPieces.filter((p) => p.full).sort(byPosition)
  const cuts = allPieces.filter((p) => !p.full).sort(byPosition)

  const tiles: Tile[] = fulls.map((p, i) => ({
    id: `t-${i}`,
    matNo: i + 1,
    full: true,
    ...p.rect,
  }))

  // 절단 조각: 재단 패킹 → 매트 번호 + 재단 위치
  const placements = packPieces(
    cuts.map((p, i) => ({ id: `c-${i}`, width: p.rect.width, height: p.rect.height })),
    size,
  )
  const placementById = new Map(placements.map((pl) => [pl.id, pl]))
  const planByBin = new Map<number, CutMatPlan>()

  cuts.forEach((p, i) => {
    const id = `c-${i}`
    const pl = placementById.get(id)!
    const matNo = fulls.length + pl.bin + 1
    tiles.push({
      id,
      matNo,
      pieceIndex: pl.index,
      full: false,
      cells: p.cells,
      ...p.rect,
    })

    let plan = planByBin.get(pl.bin)
    if (!plan) {
      plan = { matNo, pieces: [], utilization: 0 }
      planByBin.set(pl.bin, plan)
    }
    plan.pieces.push({
      tileId: id,
      pieceIndex: pl.index,
      rotated: pl.rotated,
      x: pl.x,
      y: pl.y,
      width: pl.width,
      height: pl.height,
    })
  })

  const matArea = size * size
  const cutPlan = [...planByBin.values()]
    .sort((a, b) => a.matNo - b.matNo)
    .map((plan) => ({
      ...plan,
      pieces: plan.pieces.sort((a, b) => a.pieceIndex - b.pieceIndex),
      utilization: plan.pieces.reduce((s, p) => s + p.width * p.height, 0) / matArea,
    }))

  let occupiedCells = 0
  for (const v of g.cells) occupiedCells += v

  return {
    tiles,
    fullMats: fulls.length,
    cutPieces: cuts.length,
    cutMats: cutPlan.length,
    cutPlan,
    areaMm2: occupiedCells * CELL * CELL,
  }
}
