import { create } from 'zustand'
import type { MatSpecId, Point, Quote, Room, Tile, ToolMode } from '@/types'
import { DEFAULT_SCALE, normalizeCustomSize, resolveMatSpec } from '@/constants'
import { tileRooms, type TilingMode } from '@/utils/tiling'
import { buildQuote } from '@/utils/pricing'

interface FloorPlanState {
  /** 사용자가 그린 공간 영역 목록 */
  rooms: Room[]
  /** 현재 선택된 영역 id */
  selectedRoomId: string | null
  /** 선택된 매트 규격 */
  matSpecId: MatSpecId
  /** 직접 입력한 한 변 길이 (mm, 10cm 단위) */
  customSize: number
  /** 배치 기준 (중앙 정렬 / 자재 절약) */
  tilingMode: TilingMode
  /** 캔버스 도구 모드 */
  tool: ToolMode
  /** 캔버스 스케일 (px per mm) */
  scale: number
  /** 자동 타일링 결과 */
  tiles: Tile[]
  /** 견적 결과 */
  quote: Quote | null
  /** 타일링 이후 도면/규격이 바뀌어 재배치가 필요한지 */
  tilingDirty: boolean
  /** 공간 이름 자동 번호용 카운터 */
  roomSeq: number
  /** 캔버스에 "내용에 맞춰 보기"를 요청하는 카운터 (증가할 때마다 1회 수행) */
  fitRequest: number
}

interface FloorPlanActions {
  setTool: (tool: ToolMode) => void
  setMatSpec: (id: MatSpecId) => void
  /** 직접 입력 크기를 적용하고 커스텀 규격으로 전환 */
  setCustomSize: (mm: number) => void
  setTilingMode: (mode: TilingMode) => void
  setScale: (scale: number) => void
  /** 직교 폴리곤 꼭짓점으로부터 새 공간을 생성하고 id 반환 */
  addRoom: (points: Point[], name?: string) => string
  updateRoom: (id: string, patch: Partial<Omit<Room, 'id'>>) => void
  removeRoom: (id: string) => void
  selectRoom: (id: string | null) => void
  clearRooms: () => void
  /** 현재 도면과 규격으로 매트를 배치하고 견적을 계산 */
  applyTiling: () => void
  /** 배치 결과 제거 */
  clearTiling: () => void
  /** 프리셋 도면 불러오기 (기존 공간은 대체) */
  loadPreset: (rooms: { name: string; points: Point[] }[]) => void
  /** 캔버스를 도면 전체가 보이도록 맞춤 */
  requestFit: () => void
}

export type FloorPlanStore = FloorPlanState & FloorPlanActions

export const MIN_SCALE = 0.025
export const MAX_SCALE = 0.3

const initialState: FloorPlanState = {
  rooms: [],
  selectedRoomId: null,
  matSpecId: 'mat-500',
  customSize: 900,
  tilingMode: 'center',
  tool: 'draw',
  scale: DEFAULT_SCALE,
  tiles: [],
  quote: null,
  tilingDirty: false,
  roomSeq: 1,
  fitRequest: 0,
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/** 도면이 바뀌었을 때 기존 배치가 있으면 dirty 로 표시 */
const markDirty = (s: FloorPlanState) => (s.tiles.length > 0 ? { tilingDirty: true } : {})

export const useFloorPlanStore = create<FloorPlanStore>((set, get) => ({
  ...initialState,

  setTool: (tool) => set({ tool }),

  setMatSpec: (matSpecId) => set((s) => ({ matSpecId, ...markDirty(s) })),

  setCustomSize: (mm) =>
    set((s) => ({
      customSize: normalizeCustomSize(mm),
      matSpecId: 'mat-custom',
      ...markDirty(s),
    })),

  setTilingMode: (tilingMode) => set((s) => ({ tilingMode, ...markDirty(s) })),

  setScale: (scale) => set({ scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) }),

  addRoom: (points, name) => {
    const id = createId()
    set((s) => ({
      rooms: [...s.rooms, { id, name: name ?? `공간 ${s.roomSeq}`, points }],
      selectedRoomId: id,
      roomSeq: s.roomSeq + 1,
      ...markDirty(s),
    }))
    return id
  },

  updateRoom: (id, patch) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      ...(patch.points ? markDirty(s) : {}),
    })),

  removeRoom: (id) =>
    set((s) => ({
      rooms: s.rooms.filter((r) => r.id !== id),
      selectedRoomId: s.selectedRoomId === id ? null : s.selectedRoomId,
      ...markDirty(s),
    })),

  selectRoom: (selectedRoomId) => set({ selectedRoomId }),

  clearRooms: () =>
    set({
      rooms: [],
      selectedRoomId: null,
      tiles: [],
      quote: null,
      tilingDirty: false,
      roomSeq: 1,
    }),

  applyTiling: () => {
    const { rooms, matSpecId, customSize, tilingMode } = get()
    const spec = resolveMatSpec(matSpecId, customSize)
    const result = tileRooms(rooms, spec.size, tilingMode)
    if (!result) {
      set({ tiles: [], quote: null, tilingDirty: false })
      return
    }
    set({
      tiles: result.tiles,
      quote: buildQuote(result, spec),
      tilingDirty: false,
      tool: 'select',
      selectedRoomId: null,
    })
  },

  clearTiling: () => set({ tiles: [], quote: null, tilingDirty: false }),

  loadPreset: (presetRooms) =>
    set((s) => ({
      rooms: presetRooms.map((r) => ({ id: createId(), name: r.name, points: r.points })),
      selectedRoomId: null,
      tiles: [],
      quote: null,
      tilingDirty: false,
      roomSeq: 1,
      tool: 'select',
      fitRequest: s.fitRequest + 1,
    })),

  requestFit: () => set((s) => ({ fitRequest: s.fitRequest + 1 })),
}))
