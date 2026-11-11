import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage } from 'react-konva'
import type Konva from 'konva'
import type { Point, Rect } from '@/types'
import { useElementSize } from '@/hooks/useElementSize'
import { MAX_SCALE, MIN_SCALE, useFloorPlanStore } from '@/store/useFloorPlanStore'
import {
  boundingBox,
  closeOrthoPolygon,
  orthoSnap,
  pointsEqual,
  polygonBBox,
  snapPoint,
} from '@/utils/geometry'
import { GridLayer } from './GridLayer'
import { RoomBodyLayer, RoomOverlayLayer } from './RoomLayer'
import { TileLayer } from './TileLayer'
import { CanvasHud } from './CanvasHud'

const INITIAL_OFFSET = { x: 48, y: 48 }
const ZOOM_STEP = 1.08
/** 시작점을 다시 클릭해 닫을 때 허용 반경 (px) */
const CLOSE_RADIUS_PX = 12

/**
 * Konva Stage 컨테이너.
 * - draw 모드: 클릭으로 꼭짓점을 찍어 직교 폴리곤(벽선)을 그린다.
 *   · 마우스 이동 시 마지막 점에서 수평/수직으로 스냅된 미리보기 선 표시
 *   · 시작점 클릭 / Enter / 더블클릭 → 닫기, Backspace → 한 점 취소, Esc → 전체 취소
 * - select 모드: 공간 선택 / 이동 / 꼭짓점·변 편집 (RoomShape)
 * - 휠: 커서 기준 줌, Shift+휠 또는 가운데 버튼 드래그: 패닝
 */
export function FloorPlanCanvas() {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const stageRef = useRef<Konva.Stage>(null)

  const tool = useFloorPlanStore((s) => s.tool)
  const scale = useFloorPlanStore((s) => s.scale)
  const setScale = useFloorPlanStore((s) => s.setScale)
  const setTool = useFloorPlanStore((s) => s.setTool)
  const addRoom = useFloorPlanStore((s) => s.addRoom)
  const selectRoom = useFloorPlanStore((s) => s.selectRoom)
  const removeRoom = useFloorPlanStore((s) => s.removeRoom)
  const selectedRoomId = useFloorPlanStore((s) => s.selectedRoomId)
  const hasRooms = useFloorPlanStore((s) => s.rooms.length > 0)

  const [offset, setOffset] = useState(INITIAL_OFFSET)

  // ── 드로잉 상태 (핸들러에서 최신값을 읽기 위해 ref 와 state 를 함께 유지) ──
  const [draftPoints, setDraftPointsState] = useState<Point[]>([])
  const draftRef = useRef<Point[]>([])
  const setDraftPoints = useCallback((pts: Point[]) => {
    draftRef.current = pts
    setDraftPointsState(pts)
  }, [])
  const [cursor, setCursor] = useState<Point | null>(null)
  const [canClose, setCanClose] = useState(false)
  /** 직전 클릭이 마지막 점과 같은 자리였는지 (더블클릭 닫기 판정용) */
  const lastClickWasDuplicate = useRef(false)

  const panStart = useRef<{ pointer: Point; offset: Point } | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  /** 포인터(px) → 도면 좌표(mm, 스냅 전) */
  const pointerToMmRaw = useCallback((): Point | null => {
    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return null
    return { x: (pos.x - offset.x) / scale, y: (pos.y - offset.y) / scale }
  }, [offset, scale])

  const isNearFirstPoint = useCallback(
    (raw: Point, pts: Point[]) => {
      if (pts.length < 2) return false
      const f = pts[0]
      const dx = (raw.x - f.x) * scale
      const dy = (raw.y - f.y) * scale
      return Math.hypot(dx, dy) <= CLOSE_RADIUS_PX
    },
    [scale],
  )

  const cancelDraw = useCallback(() => {
    setDraftPoints([])
    setCursor(null)
    setCanClose(false)
  }, [setDraftPoints])

  const finishDraw = useCallback(() => {
    const polygon = closeOrthoPolygon(draftRef.current)
    cancelDraw()
    if (polygon) addRoom(polygon)
  }, [addRoom, cancelDraw])

  // ── 마우스 핸들러 ────────────────────────────────────────────────
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    if (!stage) return

    if (e.evt.button === 1) {
      e.evt.preventDefault()
      const pos = stage.getPointerPosition()
      if (pos) {
        panStart.current = { pointer: pos, offset }
        setIsPanning(true)
      }
      return
    }
    if (e.evt.button !== 0) return

    if (tool === 'select') {
      if (e.target === stage) selectRoom(null)
      return
    }

    // ── draw 모드: 꼭짓점 추가 ──
    const raw = pointerToMmRaw()
    if (!raw) return
    const pts = draftRef.current

    if (pts.length === 0) {
      selectRoom(null)
      lastClickWasDuplicate.current = false
      setDraftPoints([snapPoint(raw)])
      return
    }

    if (isNearFirstPoint(raw, pts)) {
      finishDraw()
      return
    }

    const next = orthoSnap(pts[pts.length - 1], raw)
    if (pointsEqual(next, pts[pts.length - 1])) {
      // 같은 자리 재클릭: 점을 추가하지 않고 더블클릭 닫기 후보로 표시
      lastClickWasDuplicate.current = true
      return
    }
    lastClickWasDuplicate.current = false
    setDraftPoints([...pts, next])
  }

  const handleMouseMove = () => {
    const stage = stageRef.current
    if (!stage) return

    if (panStart.current) {
      const pos = stage.getPointerPosition()
      if (!pos) return
      const { pointer, offset: o } = panStart.current
      setOffset({ x: o.x + (pos.x - pointer.x), y: o.y + (pos.y - pointer.y) })
      return
    }

    if (tool !== 'draw') return
    const raw = pointerToMmRaw()
    if (!raw) return
    const pts = draftRef.current
    if (pts.length === 0) {
      setCursor(snapPoint(raw))
      setCanClose(false)
      return
    }
    setCursor(orthoSnap(pts[pts.length - 1], raw))
    setCanClose(isNearFirstPoint(raw, pts))
  }

  const handleMouseUp = () => {
    if (panStart.current) {
      panStart.current = null
      setIsPanning(false)
    }
  }

  /**
   * 더블클릭 닫기.
   * 모서리를 빠르게 연속 클릭한 경우에도 dblclick 이 발생하므로,
   * 두 번째 클릭이 마지막 점 바로 위에서 일어난 경우에만 닫는다.
   */
  const handleDblClick = () => {
    const pts = draftRef.current
    if (tool !== 'draw' || pts.length < 2) return
    if (lastClickWasDuplicate.current) finishDraw()
  }

  // ── 휠: 줌 / 패닝 ────────────────────────────────────────────────
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return

    if (e.evt.shiftKey) {
      setOffset((o) => ({ x: o.x - e.evt.deltaY, y: o.y - e.evt.deltaX }))
      return
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const next = direction > 0 ? scale * ZOOM_STEP : scale / ZOOM_STEP
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next))
    const mmUnderCursor = {
      x: (pos.x - offset.x) / scale,
      y: (pos.y - offset.y) / scale,
    }
    setScale(clamped)
    setOffset({
      x: pos.x - mmUnderCursor.x * clamped,
      y: pos.y - mmUnderCursor.y * clamped,
    })
  }

  // ── 키보드 단축키 ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (target?.isContentEditable) return

      const drawing = draftRef.current.length > 0

      switch (e.key) {
        case 'r':
        case 'R':
          setTool('draw')
          break
        case 'v':
        case 'V':
          cancelDraw()
          setTool('select')
          break
        case 'Enter':
          if (drawing) finishDraw()
          break
        case 'Backspace':
        case 'Delete':
          if (drawing) {
            e.preventDefault()
            setDraftPoints(draftRef.current.slice(0, -1))
          } else if (selectedRoomId) {
            removeRoom(selectedRoomId)
          }
          break
        case 'Escape':
          cancelDraw()
          selectRoom(null)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedRoomId, setTool, removeRoom, selectRoom, cancelDraw, finishDraw, setDraftPoints])

  // 도구가 draw 에서 벗어나면 그리던 내용을 취소 (ToolBar 버튼으로 전환한 경우 포함)
  useEffect(
    () =>
      useFloorPlanStore.subscribe((s, prev) => {
        if (s.tool !== prev.tool && s.tool !== 'draw') cancelDraw()
      }),
    [cancelDraw],
  )

  /** 도면 전체가 보이도록 스케일/오프셋 조정 */
  const fitToContent = useCallback(() => {
    const rooms = useFloorPlanStore.getState().rooms
    const boxes = rooms.map((r) => polygonBBox(r.points)).filter((b): b is Rect => !!b)
    const bbox = boundingBox(boxes)
    if (!bbox || size.width === 0 || size.height === 0) return
    const margin = 64
    const next = Math.min(
      (size.width - margin * 2) / bbox.width,
      (size.height - margin * 2) / bbox.height,
    )
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next))
    setScale(clamped)
    setOffset({
      x: (size.width - bbox.width * clamped) / 2 - bbox.x * clamped,
      y: (size.height - bbox.height * clamped) / 2 - bbox.y * clamped,
    })
  }, [size.width, size.height, setScale])

  // 프리셋 불러오기 등에서 fitRequest 가 증가하면 1회 맞춤
  useEffect(
    () =>
      useFloorPlanStore.subscribe((s, prev) => {
        if (s.fitRequest !== prev.fitRequest) fitToContent()
      }),
    [fitToContent],
  )

  const resetView = () => {
    setOffset(INITIAL_OFFSET)
    setScale(0.1)
  }

  const cursorStyle = isPanning ? 'grabbing' : tool === 'draw' ? 'crosshair' : 'default'
  const isDrawing = draftPoints.length > 0

  return (
    <div ref={ref} className="absolute inset-0" style={{ cursor: cursorStyle }}>
      {size.width > 0 && size.height > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp()
            setCursor(null)
          }}
          onDblClick={handleDblClick}
          onWheel={handleWheel}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          <GridLayer width={size.width} height={size.height} scale={scale} offset={offset} />
          <RoomBodyLayer scale={scale} offset={offset} />
          <TileLayer scale={scale} offset={offset} />
          <RoomOverlayLayer
            scale={scale}
            offset={offset}
            draft={{ points: draftPoints, cursor, canClose }}
          />
        </Stage>
      )}

      <CanvasHud
        scale={scale}
        tool={tool}
        isDrawing={isDrawing}
        onZoomIn={() => setScale(scale * ZOOM_STEP)}
        onZoomOut={() => setScale(scale / ZOOM_STEP)}
        onReset={resetView}
        onFit={hasRooms ? fitToContent : undefined}
      />

      {!hasRooms && !isDrawing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/80 px-8 py-6 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-stone-700">아직 그려진 공간이 없습니다</p>
            <p className="mt-1 text-xs text-stone-500">
              캔버스를 클릭해 벽의 모서리를 차례로 찍고, 시작점을 다시 클릭하면 공간이 완성됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
