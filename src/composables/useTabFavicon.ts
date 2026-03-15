import { onMounted, onUnmounted } from 'vue'

const CANVAS_SIZE = 32
const FRAME_INTERVAL_MS = 500

type PixelGrid = [number, number, number, number][][]

function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, alpha]
}

const TRANSPARENT: [number, number, number, number] = [0, 0, 0, 0]
const BRIGHT_YELLOW = hexToRgba('#FFE566', 255)
const GOLD = hexToRgba('#FFB800', 255)
const DARK_GOLD = hexToRgba('#CC8800', 255)
const DIM_YELLOW = hexToRgba('#FFE566', 120)

function buildEmptyGrid(): PixelGrid {
  return Array.from({ length: CANVAS_SIZE }, () =>
    Array.from({ length: CANVAS_SIZE }, () => TRANSPARENT),
  )
}

function setPixel(grid: PixelGrid, x: number, y: number, color: [number, number, number, number]) {
  if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return
  grid[y]![x] = color
}

function drawCross(
  grid: PixelGrid,
  cx: number,
  cy: number,
  length: number,
  color: [number, number, number, number],
) {
  for (let i = 1; i <= length; i++) {
    setPixel(grid, cx + i, cy, color)
    setPixel(grid, cx - i, cy, color)
    setPixel(grid, cx, cy + i, color)
    setPixel(grid, cx, cy - i, color)
  }
}

function drawDiagonal(
  grid: PixelGrid,
  cx: number,
  cy: number,
  length: number,
  color: [number, number, number, number],
) {
  for (let i = 1; i <= length; i++) {
    setPixel(grid, cx + i, cy + i, color)
    setPixel(grid, cx - i, cy + i, color)
    setPixel(grid, cx + i, cy - i, color)
    setPixel(grid, cx - i, cy - i, color)
  }
}

function buildFrame1(): PixelGrid {
  const grid = buildEmptyGrid()
  const cx = 15
  const cy = 15

  setPixel(grid, cx, cy, BRIGHT_YELLOW)
  drawCross(grid, cx, cy, 5, GOLD)
  drawCross(grid, cx, cy, 6, DARK_GOLD)
  drawDiagonal(grid, cx, cy, 2, GOLD)
  drawDiagonal(grid, cx, cy, 3, DARK_GOLD)

  return grid
}

function buildFrame2(): PixelGrid {
  const grid = buildEmptyGrid()
  const cx = 15
  const cy = 15

  setPixel(grid, cx, cy, BRIGHT_YELLOW)
  drawCross(grid, cx, cy, 7, GOLD)
  drawCross(grid, cx, cy, 8, DARK_GOLD)
  drawDiagonal(grid, cx, cy, 3, GOLD)
  drawDiagonal(grid, cx, cy, 4, DARK_GOLD)

  const glintPositions = [
    [cx - 8, cy - 8],
    [cx + 8, cy + 8],
    [cx + 9, cy - 6],
    [cx - 6, cy + 9],
  ]
  for (const pos of glintPositions) {
    setPixel(grid, pos[0]!, pos[1]!, DIM_YELLOW)
  }

  return grid
}

function buildFrame3(): PixelGrid {
  const grid = buildEmptyGrid()
  const cx = 15
  const cy = 15

  setPixel(grid, cx, cy, BRIGHT_YELLOW)
  drawCross(grid, cx, cy, 3, GOLD)
  drawCross(grid, cx, cy, 4, DARK_GOLD)
  drawDiagonal(grid, cx, cy, 1, GOLD)
  drawDiagonal(grid, cx, cy, 2, DARK_GOLD)

  return grid
}

function buildFrame4(): PixelGrid {
  const grid = buildEmptyGrid()
  const cx = 15
  const cy = 15

  setPixel(grid, cx, cy, BRIGHT_YELLOW)
  drawCross(grid, cx, cy, 7, GOLD)
  drawCross(grid, cx, cy, 8, DARK_GOLD)
  drawDiagonal(grid, cx, cy, 3, GOLD)
  drawDiagonal(grid, cx, cy, 4, DARK_GOLD)

  const glintPositions = [
    [cx + 8, cy - 8],
    [cx - 8, cy + 8],
    [cx - 9, cy - 6],
    [cx + 6, cy + 9],
  ]
  for (const pos of glintPositions) {
    setPixel(grid, pos[0]!, pos[1]!, DIM_YELLOW)
  }

  return grid
}

const FRAMES: PixelGrid[] = [buildFrame1(), buildFrame2(), buildFrame3(), buildFrame4()]

function renderFrameToDataUrl(grid: PixelGrid): string {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE)

  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const idx = (y * CANVAS_SIZE + x) * 4
      const pixel = grid[y]![x]!
      imageData.data[idx] = pixel[0]
      imageData.data[idx + 1] = pixel[1]
      imageData.data[idx + 2] = pixel[2]
      imageData.data[idx + 3] = pixel[3]
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

function getOrCreateFaviconLink(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (existing) return existing

  const link = document.createElement('link')
  link.rel = 'icon'
  document.head.appendChild(link)
  return link
}

export function useTabFavicon() {
  let frameIndex = 0
  let intervalId: ReturnType<typeof setInterval> | null = null
  let dataUrls: string[] = []

  onMounted(() => {
    dataUrls = FRAMES.map(renderFrameToDataUrl)
    const link = getOrCreateFaviconLink()

    link.href = dataUrls[0]!

    intervalId = setInterval(() => {
      frameIndex = (frameIndex + 1) % dataUrls.length
      link.href = dataUrls[frameIndex]!
    }, FRAME_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  })
}
