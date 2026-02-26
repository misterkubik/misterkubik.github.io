import { Color, Texture } from 'pixi.js'

type PointLike = { x: number; y: number }

type Transformable = {
  parent: { worldTransform: { clone(): { invert(): unknown; append(matrix: unknown): unknown } } }
  worldTransform: { clone(): unknown }
  transform: { setFromMatrix(matrix: unknown): void }
  updateTransform(): void
}

type Scaleable = {
  width: number
  height: number
  scale: { set(value: number): void }
}

export default class Utils {
  static clamp(a: number, min = 0, max = 1) {
    return Math.max(Math.min(min, max), Math.min(a, Math.max(min, max)))
  }

  static lerp(t: number, a: number, b: number) {
    return b * t + a * (1 - t)
  }

  static inverseLerp(v: number, min: number, max: number) {
    const n = Utils.clamp(v, min, max)
    return (n - min) / (max - min)
  }

  static remap(v: number, min: number, max: number, a: number, b: number) {
    return Utils.lerp(Utils.inverseLerp(v, min, max), a, b)
  }

  static lerpArray(t: number, arr: number[]) {
    const time = t * (arr.length - 1)
    const timeFrom = Math.floor(time)
    const timeTo = Math.ceil(time)
    if (timeFrom === timeTo) {
      return arr[timeFrom]
    }
    return Utils.remap(time, timeFrom, timeTo, arr[timeFrom], arr[timeTo])
  }

  static lerpColor(t: number, a: number, b: number): number
  static lerpColor(t: number, a: number[], b: number[]): number[]
  static lerpColor(t: number, a: number[] | number, b: number[] | number) {
    const outClrArr: number[] = []
    const aClrArr = Array.isArray(a) ? a : new Color(a).toArray()
    const bClrArr = Array.isArray(b) ? b : new Color(b).toArray()
    for (let i = 0; i < aClrArr.length; i += 1) {
      outClrArr.push(Utils.lerp(t, aClrArr[i], bClrArr[i]))
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      return outClrArr
    }

    const r = Math.round(outClrArr[0] * 255)
    const g = Math.round(outClrArr[1] * 255)
    const bl = Math.round(outClrArr[2] * 255)
    return (r << 16) | (g << 8) | bl
  }

  static random(from?: number, to?: number) {
    if (from === undefined) {
      return Math.random()
    }
    if (to === undefined) {
      return Math.random() * from
    }
    return from + Math.random() * (to - from)
  }

  static randomInt(from: number, to?: number) {
    const min = Math.ceil(from)

    if (to === undefined) {
      return Math.trunc(Math.random() * from)
    }

    const max = Math.floor(to)

    return Math.trunc(Math.random() * (max - min + 1)) + min
  }

  static pick<T>(arr: T[]) {
    return arr[Math.trunc(Math.random() * arr.length)]
  }

  static randomSign() {
    return Utils.pick([-1, 1])
  }

  static distanceXY(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
    const w = Math.max(x1, x2) - Math.min(x1, x2)
    const h = Math.max(y1, y2) - Math.min(y1, y2)
    return Math.sqrt(w ** 2 + h ** 2)
  }

  static distance(pointA: PointLike, pointB: PointLike) {
    return Utils.distanceXY(pointA.x, pointA.y, pointB.x, pointB.y)
  }

  static angleFromXY(x1: number, y1: number, x2: number, y2: number, min = false) {
    const ang = Math.atan2(y2 - y1, x2 - x1)
    return min ? Math.min(ang, Math.abs(Math.PI * 2 - ang)) : ang
  }

  static calculateIntersection(
    x1: number,
    y1: number,
    x3: number,
    y3: number,
    x2: number,
    y2: number,
    x4: number,
    y4: number
  ) {
    const det = (x1 - x3) * (y2 - y4) - (y1 - y3) * (x2 - x4)
    if (Math.abs(det) < 1e-10) {
      return null
    }

    const px = ((x1 * y3 - y1 * x3) * (x2 - x4) - (x1 - x3) * (x2 * y4 - y2 * x4)) / det
    const py = ((x1 * y3 - y1 * x3) * (y2 - y4) - (y1 - y3) * (x2 * y4 - y2 * x4)) / det

    return [px, py] as const
  }

  static applyWorldTransform(obj: Transformable, target: Transformable) {
    const objMatrix = obj.parent.worldTransform.clone().invert() as {
      append(matrix: unknown): unknown
    }
    const targetMatrix = target.worldTransform.clone()
    objMatrix.append(targetMatrix)
    obj.transform.setFromMatrix(objMatrix)
    obj.updateTransform()
  }

  static generateDotTexture(size = 50, blur = 0) {
    const canvas = document.createElement('canvas')
    const w = size * 2 + blur * 2 + 8
    canvas.width = canvas.height = w
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return Texture.WHITE
    }
    if (blur > 0) {
      ctx.filter = `blur(${blur / 10}px)`
    }
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(w / 2, w / 2, size / 2 - blur / 2, 0, Math.PI * 2)
    ctx.fill()

    return Texture.from(canvas)
  }

  static generateEllipseTexture(width = 50, height = 10, blur = 0) {
    const canvas = document.createElement('canvas')
    const w = width * 2 + blur * 2
    const h = height * 2 + blur * 2
    const max = Math.max(w, h)
    canvas.width = max
    canvas.height = max
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return Texture.WHITE
    }
    if (blur > 0) {
      ctx.filter = `blur(${blur / 10}px)`
    }
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(max / 2, max / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    return Texture.from(canvas)
  }

  static generateGrid<T extends { position: { set(x: number, y: number): void } }>(
    ObjClass: new (...args: unknown[]) => T,
    params: { offsetX?: number; offsetY?: number; rows?: number; columns?: number } = {},
    ...args: unknown[]
  ) {
    const { offsetX = 50, offsetY = 50, rows = 2, columns = 2 } = params
    const gridArray: T[] = []
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const cell = new ObjClass(...args)
        const posX = (x - columns / 2 + 0.5) * offsetX
        const posY = (y - rows / 2 + 0.5) * offsetY
        cell.position.set(posX, posY)
        gridArray.push(cell)
      }
    }

    return gridArray
  }

  static rescaleMaxWidth(obj: Scaleable, width: number) {
    obj.scale.set(1)
    const newScale = Math.min(width / obj.width, 1)
    obj.scale.set(newScale)
  }

  static rescaleMaxHeight(obj: Scaleable, height: number) {
    obj.scale.set(1)
    const newScale = Math.min(height / obj.height, 1)
    obj.scale.set(newScale)
  }
}
