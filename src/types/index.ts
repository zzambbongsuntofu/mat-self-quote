/**
 * 도메인 타입 정의
 * - 모든 길이 단위는 mm 로 통일한다. (렌더링 시에만 px 로 변환)
 */

/** 2D 좌표 (mm) */
export interface Point {
  x: number
  y: number
}

/** 축 정렬 직사각형 (mm) */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 사용자가 그린 하나의 공간 영역 (거실, 복도 등).
 * 모든 변이 수평/수직인 직교 폴리곤(rectilinear polygon)으로 표현한다.
 * points 는 닫힌 순서(마지막 점 → 첫 점으로 연결)이며 첫 점을 중복 저장하지 않는다.
 */
export interface Room {
  id: string
  name: string
  points: Point[]
}

/** 미리 정해 둔 매트 규격 */
export type PresetMatSpecId = 'mat-500' | 'mat-600' | 'mat-800' | 'mat-1000' | 'mat-1200'

/** 매트 규격 식별자. custom 은 사용자가 한 변 길이를 직접 입력한 경우 */
export type MatSpecId = PresetMatSpecId | 'mat-custom'

/** 매트 규격 */
export interface MatSpec {
  id: MatSpecId
  label: string
  /** 한 변의 길이 (정사각형, mm) */
  size: number
  /** 장당 단가 (원) */
  unitPrice: number
}

/**
 * 도면 위에 놓이는 매트 조각 하나.
 * - full: 온장 그대로 놓이는 매트
 * - cut : 경계에서 잘라 쓰는 조각. 여러 조각이 한 장(matNo)에서 재단될 수 있다.
 * x/y/width/height 는 조각의 바운딩 박스(mm).
 */
export interface Tile extends Rect {
  id: string
  /** 물리적 매트 번호 (1부터). 같은 번호의 조각은 한 장에서 재단 */
  matNo: number
  /** 같은 매트에서 나온 조각 순번 (0=a, 1=b …). 온장은 undefined */
  pieceIndex?: number
  full: boolean
  /**
   * 조각이 직사각형이 아닐 때(ㄱ자 등) 점유 셀(10cm) 원점 목록.
   * 직사각형이면 undefined 이며 바운딩 박스를 그대로 그린다.
   */
  cells?: Point[]
}

/** 재단용 매트 한 장 안에 놓인 조각 (매트 좌상단 기준 mm) */
export interface CutPlacement extends Rect {
  /** 도면 위 타일 id */
  tileId: string
  pieceIndex: number
  rotated: boolean
}

/** 재단용 매트 한 장의 재단 계획 */
export interface CutMatPlan {
  matNo: number
  pieces: CutPlacement[]
  /** 사용 면적 비율 (0~1) */
  utilization: number
}

/** 견적 산출 결과 */
export interface Quote {
  /** 온장으로 쓰이는 매트 수 */
  fullMats: number
  /** 절단 조각 수 */
  cutPieces: number
  /** 절단 조각을 재단하는 데 필요한 매트 수 */
  cutMats: number
  /** 총 필요 매트 수 */
  totalMats: number
  /** 총 시공 면적 (m²) */
  areaM2: number
  /** 구매 매트 총 면적 (m²) */
  purchasedM2: number
  /** 매트 장당 단가 (원) */
  unitPrice: number
  /** 총 견적 (원) */
  total: number
  /** 재단 계획 */
  cutPlan: CutMatPlan[]
}

/** 캔버스 조작 도구 */
export type ToolMode = 'select' | 'draw'
