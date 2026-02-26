import { gsap } from 'gsap'
import {
  Assets,
  Container,
  Mesh,
  MeshMaterial,
  ObservablePoint,
  PlaneGeometry,
  Program,
  Texture,
  TextureMatrix,
} from 'pixi.js'
import { getShaderPair } from '../core/shader-loader'

export type CardConfig = {
  textureFront?: Texture | string
  textureBack?: Texture | string
  foldAngle?: number
  foldProgress?: number
  foldForce?: number
  foldSymmetry?: number
  dim?: number
  width?: number
  height?: number
  scale?: number
}

export type FlipAnimationOptions = {
  angle?: number
  symmetry?: number
  ease?: string
  duration?: number
}

type CardUniforms = {
  uSamplerFront: Texture
  uSamplerBack: Texture
  uTextureMatrixFront: Float32Array
  uTextureMatrixBack: Float32Array
  uFoldAngle: number
  uFoldProgress: number
  uFoldForce: number
  uFoldSymmetry: number
  uRes: [number, number]
  uDim: number
}

const SHADER_NAME = 'BaseFlippingCard'

export class Card extends Container {
  protected readonly mesh: Mesh
  protected readonly material: MeshMaterial
  protected uniforms: CardUniforms
  private planeWidth: number
  private planeHeight: number
  private readonly hasExplicitSize: boolean
  private readonly _anchor: ObservablePoint

  constructor(config: CardConfig = {}) {
    super()

    const frontTexture = this.resolveTexture(config.textureFront)
    const backTexture = this.resolveTexture(config.textureBack)
    const { width, height } = this.resolveSize(frontTexture, config)
    this.hasExplicitSize = config.width !== undefined || config.height !== undefined
    this.planeWidth = width
    this.planeHeight = height
    this._anchor = new ObservablePoint(this.onAnchorUpdate, this, 0.5, 0.5)

    const { vertex, fragment } = getShaderPair(SHADER_NAME)
    const program = Program.from(vertex, fragment)

    this.uniforms = {
      uSamplerFront: frontTexture,
      uSamplerBack: backTexture,
      uTextureMatrixFront: createTextureMatrix(frontTexture),
      uTextureMatrixBack: createTextureMatrix(backTexture),
      uFoldAngle: config.foldAngle ?? 0,
      uFoldProgress: config.foldProgress ?? 0,
      uFoldForce: config.foldForce ?? 0.6,
      uFoldSymmetry: config.foldSymmetry ?? 1,
      uRes: [width, height],
      uDim: config.dim ?? 0,
    }

    const geometry = new PlaneGeometry(1, 1, 4, 5)
    this.material = new MeshMaterial(backTexture, {
      program,
      uniforms: this.uniforms,
    })
    this.mesh = new Mesh(geometry, this.material)
    this.uniforms = this.material.uniforms as CardUniforms

    this.addChild(this.mesh)
    this.applyPlaneSize(this.planeWidth, this.planeHeight)
    this.scale.set(config.scale ?? 0.5)
  }

  set texture(texture: Texture | string) {
    this.textureFront = texture
    this.textureBack = texture
  }

  get texture() {
    return this.textureFront
  }

  get anchor() {
    return this._anchor
  }

  set anchor(value: number | { x: number; y: number }) {
    if (typeof value === 'number') {
      this._anchor.set(value, value)
      return
    }
    this._anchor.set(value.x, value.y)
  }

  set textureFront(texture: Texture | string) {
    const next = this.resolveTexture(texture)
    this.uniforms.uSamplerFront = next
    this.uniforms.uTextureMatrixFront = createTextureMatrix(next)
    if (!this.hasExplicitSize) {
      const { width, height } = this.resolveSize(next, {})
      this.applyPlaneSize(width, height)
      return
    }
    this.uniforms.uRes = [this.planeWidth, this.planeHeight]
  }

  get textureFront() {
    return this.uniforms.uSamplerFront
  }

  set textureBack(texture: Texture | string) {
    const next = this.resolveTexture(texture)
    this.uniforms.uSamplerBack = next
    this.uniforms.uTextureMatrixBack = createTextureMatrix(next)
    this.material.texture = next
  }

  get textureBack() {
    return this.uniforms.uSamplerBack
  }

  set foldAngle(value: number) {
    this.uniforms.uFoldAngle = value
  }

  get foldAngle() {
    return this.uniforms.uFoldAngle
  }

  set foldForce(value: number) {
    this.uniforms.uFoldForce = value
  }

  get foldForce() {
    return this.uniforms.uFoldForce
  }

  set foldSymmetry(value: number) {
    this.uniforms.uFoldSymmetry = value
  }

  get foldSymmetry() {
    return this.uniforms.uFoldSymmetry
  }

  set progress(value: number) {
    this.uniforms.uFoldProgress = value
  }

  get progress() {
    return this.uniforms.uFoldProgress
  }

  set dim(value: number) {
    this.uniforms.uDim = value
  }

  get dim() {
    return this.uniforms.uDim
  }

  playFoldAnimation(side: 'front' | 'back' = 'front', options: FlipAnimationOptions = {}) {
    this.foldAngle = options.angle ?? this.foldAngle
    this.foldSymmetry = options.symmetry ?? this.foldSymmetry

    return gsap.to(this, {
      progress: side === 'front' ? 1 : 0,
      duration: options.duration ?? 1,
      ease: options.ease ?? 'power2.inOut',
    })
  }

  flipToFront(options: FlipAnimationOptions = {}) {
    return this.playFoldAnimation('front', options)
  }

  flipToBack(options: FlipAnimationOptions = {}) {
    return this.playFoldAnimation('back', options)
  }

  protected resolveTexture(texture?: Texture | string) {
    if (!texture) {
      return Texture.WHITE
    }

    if (texture instanceof Texture) {
      return texture
    }

    const fromAssets = Assets.get(texture)
    return fromAssets instanceof Texture ? fromAssets : Texture.WHITE
  }

  private resolveSize(texture: Texture, config: CardConfig) {
    const fallbackWidth = texture === Texture.WHITE ? 80 : texture.orig.width
    const fallbackHeight = texture === Texture.WHITE ? 120 : texture.orig.height
    const width = config.width ?? fallbackWidth ?? 80
    const height = config.height ?? fallbackHeight ?? 120
    return { width, height }
  }

  private onAnchorUpdate() {
    this.pivot.set(
      (this._anchor.x - 0.5) * this.planeWidth,
      (this._anchor.y - 0.5) * this.planeHeight
    )
  }

  private applyPlaneSize(width: number, height: number) {
    this.planeWidth = width
    this.planeHeight = height
    const oldGeometry = this.mesh.geometry
    this.mesh.geometry = new PlaneGeometry(width, height, 4, 5)
    oldGeometry.destroy()
    this.mesh.position.set(-width / 2, -height / 2)
    this.uniforms.uRes = [width, height]
    this.onAnchorUpdate()
  }
}

function createTextureMatrix(texture: Texture) {
  const matrix = new TextureMatrix(texture)
  matrix.update()
  return matrix.mapCoord.toArray(true) as Float32Array
}
