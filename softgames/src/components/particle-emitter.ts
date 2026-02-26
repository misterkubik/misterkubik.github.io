import { Assets, BLEND_MODES, Container, Sprite, Texture } from 'pixi.js'
import { gsap } from 'gsap'
import Utils from '../core/utils'

export type RandomRange = number | [number, number]
export type VectorRange = { x: RandomRange; y: RandomRange }

export type ParticleEmitterOptions = {
  maxParticles?: number
  spawnRate?: number
  useGlobalTimeScale?: boolean
}

export type ParticleConfig = {
  name?: string
  chance?: number
  textures?: string | string[]
  color?: number | number[]
  scale?: RandomRange
  scaleOverLife?: number[]
  alphaOverLife?: number[]
  colorOverLife?: number[]
  life?: RandomRange
  velocity?: RandomRange
  velocityOverLife?: number[]
  vector?: VectorRange
  rotation?: RandomRange
  rotationVelocity?: RandomRange
  originX?: RandomRange
  originY?: RandomRange
}

type ResolvedParticleConfig = ParticleConfig & {
  name: string
  chance: number
  textures: string | string[]
  scale: RandomRange
  scaleOverLife: number[]
  alphaOverLife: number[]
  life: RandomRange
  velocity: RandomRange
  velocityOverLife: number[]
  vector: VectorRange
  rotation: RandomRange
  rotationVelocity: RandomRange
  originX: RandomRange
  originY: RandomRange
  textureVariants: Texture[][]
}

type Particle = {
  sprite: Sprite
  active: boolean
  life: number
  maxLife: number
  velocity: number
  directionX: number
  directionY: number
  rotationVelocity: number
  frames: Texture[]
  baseScale: number
  color: number
  config: ResolvedParticleConfig | null
}

export class ParticleEmitter extends Container {
  private readonly optionsNormalized: Required<ParticleEmitterOptions>
  private readonly particles: Particle[] = []
  private readonly configs: ResolvedParticleConfig[] = []
  private readonly chanceRanges: Array<{ end: number; config: ResolvedParticleConfig }> = []
  private totalChance = 0
  private configId = 0
  private spawnAccumulator = 0

  constructor(options: ParticleEmitterOptions = {}) {
    super()
    this.optionsNormalized = {
      maxParticles: options.maxParticles ?? 10,
      spawnRate: options.spawnRate ?? 10,
      useGlobalTimeScale: options.useGlobalTimeScale ?? true,
    }
    this.initPool()
  }

  add(config: ParticleConfig = {}) {
    const normalized = this.normalizeConfig(config)
    const existing = this.configs.find((item) => item.name === normalized.name)
    if (existing) {
      this.applyConfig(existing, normalized)
      this.rebuildChanceCache()
      return this
    }

    this.configs.push(normalized)
    this.rebuildChanceCache()
    return this
  }

  getConfig(name: string) {
    const config = this.configs.find((item) => item.name === name)
    if (!config) {
      return null
    }
    const { textureVariants, ...plainConfig } = config
    return { ...plainConfig }
  }

  updateConfig(name: string, patch: ParticleConfig) {
    const existing = this.configs.find((item) => item.name === name)
    if (!existing) {
      return false
    }

    const normalized = this.normalizeConfig({ ...existing, ...patch, name })
    this.applyConfig(existing, normalized)
    this.rebuildChanceCache()
    return true
  }

  removeConfig(name: string) {
    const index = this.configs.findIndex((item) => item.name === name)
    if (index === -1) {
      return false
    }

    const config = this.configs[index]
    this.configs.splice(index, 1)
    this.rebuildChanceCache()
    for (const particle of this.particles) {
      if (particle.config !== config) {
        continue
      }
      particle.active = false
      particle.config = null
      particle.sprite.visible = false
      particle.sprite.alpha = 0
    }

    return true
  }

  reset() {
    this.spawnAccumulator = 0
    for (const particle of this.particles) {
      particle.active = false
      particle.config = null
      particle.sprite.visible = false
      particle.sprite.alpha = 0
    }
  }

  update(delta: number) {
    if (this.configs.length === 0) {
      return
    }

    const timeScale =
      this.optionsNormalized.useGlobalTimeScale === false
        ? 1
        : Utils.clamp(gsap.globalTimeline.timeScale(), 0, Number.POSITIVE_INFINITY)
    const dt = (delta / 60) * timeScale

    this.spawnAccumulator += dt * this.optionsNormalized.spawnRate
    while (this.spawnAccumulator >= 1) {
      this.spawnParticle()
      this.spawnAccumulator -= 1
    }

    for (const particle of this.particles) {
      if (!particle.active || !particle.config) {
        continue
      }
      this.updateParticle(particle, dt)
    }
  }

  private initPool() {
    for (let i = 0; i < this.optionsNormalized.maxParticles; i += 1) {
      const sprite = new Sprite(Texture.WHITE)
      sprite.anchor.set(0.5)
      sprite.visible = false
      sprite.blendMode = BLEND_MODES.ADD
      this.addChild(sprite)

      this.particles.push({
        sprite,
        active: false,
        life: 0,
        maxLife: 0,
        velocity: 0,
        directionX: 0,
        directionY: -1,
        rotationVelocity: 0,
        frames: [Texture.WHITE],
        baseScale: 1,
        color: 0xffffff,
        config: null,
      })
    }
  }

  private spawnParticle() {
    const particle = this.particles.find((item) => !item.active)
    if (!particle || this.configs.length === 0) {
      return
    }

    const config = this.pickConfigByChance()
    if (!config) {
      return
    }
    particle.active = true
    particle.config = config
    particle.life = 0
    particle.maxLife = this.resolveRange(config.life)
    particle.velocity = this.resolveRange(config.velocity)
    this.applyDirection(particle, config.vector)
    particle.rotationVelocity = this.resolveRange(config.rotationVelocity)
    particle.baseScale = this.resolveRange(config.scale)
    particle.color = this.resolveColorValue(config.color)
    particle.frames = Utils.pick(config.textureVariants)

    particle.sprite.position.set(
      this.resolveRange(config.originX),
      this.resolveRange(config.originY)
    )
    particle.sprite.visible = true
    particle.sprite.texture = particle.frames[0] ?? Texture.WHITE
    particle.sprite.rotation = this.resolveRange(config.rotation)
    particle.sprite.scale.set(particle.baseScale * (config.scaleOverLife[0] ?? 0))
    particle.sprite.alpha = config.alphaOverLife?.[0] ?? 1
    particle.sprite.tint = this.resolveColor(config, particle.color, 0)
  }

  private updateParticle(particle: Particle, dt: number) {
    const config = particle.config
    if (!config) {
      return
    }

    particle.life += dt
    const t = Utils.inverseLerp(particle.life, 0, particle.maxLife)

    if (t >= 1) {
      particle.active = false
      particle.config = null
      particle.sprite.visible = false
      return
    }

    const speedMultiplier = Utils.lerpArray(t, config.velocityOverLife)
    const speed = particle.velocity * speedMultiplier
    particle.sprite.x += particle.directionX * speed * dt
    particle.sprite.y += particle.directionY * speed * dt
    particle.sprite.rotation += particle.rotationVelocity * dt

    const frameIndices = Array.from({ length: particle.frames.length }, (_, i) => i)
    const frameIndex = Math.round(Utils.lerpArray(t, frameIndices))
    particle.sprite.texture = particle.frames[frameIndex] ?? particle.frames[0] ?? Texture.WHITE

    particle.sprite.scale.set(particle.baseScale * Utils.lerpArray(t, config.scaleOverLife))
    particle.sprite.alpha = Utils.clamp(Utils.lerpArray(t, config.alphaOverLife ?? [1, 0]), 0, 1)
    particle.sprite.tint = this.resolveColor(config, particle.color, t)
  }

  private resolveColor(config: ResolvedParticleConfig, baseColor: number, t: number) {
    const colors = config.colorOverLife
    if (!colors || colors.length === 0) {
      return baseColor
    }
    if (colors.length === 1) {
      return colors[0]
    }

    const colorIndices = Array.from({ length: colors.length }, (_, i) => i)
    const indexFloat = Utils.lerpArray(t, colorIndices)
    const fromIndex = Math.floor(indexFloat)
    const toIndex = Math.ceil(indexFloat)
    const mix = indexFloat - fromIndex

    if (fromIndex === toIndex) {
      return colors[fromIndex]
    }

    return Utils.lerpColor(mix, colors[fromIndex], colors[toIndex])
  }

  private loadTextureVariants(source: string | string[]) {
    const values = Array.isArray(source) ? source : [source]
    const variants = values
      .map((entry) => this.resolveTextureEntry(entry))
      .filter((frames) => frames.length > 0)

    return variants.length > 0 ? variants : [[Texture.WHITE]]
  }

  private resolveTextureEntry(entry: string) {
    const match = entry.match(/^(.*)\{(\d+)-(\d+)\}$/)
    if (match) {
      const prefix = match[1]
      const from = Number(match[2])
      const to = Number(match[3])
      if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) {
        return [] as Texture[]
      }

      const frames: Texture[] = []
      for (let i = from; i <= to; i += 1) {
        const texture = Assets.get(`${prefix}${i}`)
        if (texture instanceof Texture) {
          frames.push(texture)
        }
      }
      return frames
    }

    const texture = Assets.get(entry)
    return texture instanceof Texture ? [texture] : ([] as Texture[])
  }

  private resolveRange(value: RandomRange) {
    return Array.isArray(value) ? Utils.random(value[0], value[1]) : value
  }

  private resolveColorValue(color?: number | number[]) {
    if (Array.isArray(color)) {
      return color.length > 0 ? Utils.pick(color) : 0xffffff
    }
    return color ?? 0xffffff
  }

  private pickConfigByChance() {
    if (this.totalChance <= 0) {
      return this.configs.length > 0 ? Utils.pick(this.configs) : null
    }

    const roll = Utils.random(0, this.totalChance)
    for (const range of this.chanceRanges) {
      if (roll < range.end) {
        return range.config
      }
    }

    return this.chanceRanges[this.chanceRanges.length - 1]?.config ?? null
  }

  private normalizeConfig(config: ParticleConfig): ResolvedParticleConfig {
    return {
      name: config.name ?? `particle_${this.configId++}`,
      chance: config.chance ?? 1,
      textures: config.textures ?? 'particle',
      color: config.color ?? 0xffffff,
      scale: config.scale ?? 1,
      scaleOverLife: config.scaleOverLife ?? [1, 1, 0],
      alphaOverLife: config.alphaOverLife ?? [1, 0],
      colorOverLife: config.colorOverLife,
      life: config.life ?? [0.5, 1],
      velocity: config.velocity ?? 0,
      velocityOverLife: config.velocityOverLife ?? [1, 1, 1],
      vector: config.vector ?? { x: 0, y: -1 },
      rotation: config.rotation ?? 0,
      rotationVelocity: config.rotationVelocity ?? 0,
      originX: config.originX ?? 0,
      originY: config.originY ?? 0,
      textureVariants: this.loadTextureVariants(config.textures ?? 'particle'),
    }
  }

  private applyConfig(target: ResolvedParticleConfig, source: ResolvedParticleConfig) {
    target.name = source.name
    target.textures = source.textures
    target.color = source.color
    target.scale = source.scale
    target.scaleOverLife = source.scaleOverLife
    target.alphaOverLife = source.alphaOverLife
    target.colorOverLife = source.colorOverLife
    target.life = source.life
    target.velocity = source.velocity
    target.velocityOverLife = source.velocityOverLife
    target.vector = source.vector
    target.rotation = source.rotation
    target.rotationVelocity = source.rotationVelocity
    target.originX = source.originX
    target.originY = source.originY
    target.textureVariants = source.textureVariants
  }

  private applyDirection(particle: Particle, vector: VectorRange) {
    const x = this.resolveRange(vector.x)
    const y = this.resolveRange(vector.y)
    const length = Utils.distanceXY(0, 0, x, y)
    if (length <= 1e-6) {
      particle.directionX = 0
      particle.directionY = -1
      return
    }
    particle.directionX = x / length
    particle.directionY = y / length
  }

  private rebuildChanceCache() {
    this.chanceRanges.length = 0
    this.totalChance = 0

    for (const config of this.configs) {
      this.totalChance += Utils.clamp(config.chance, 0, Number.POSITIVE_INFINITY)
      this.chanceRanges.push({
        end: this.totalChance,
        config,
      })
    }
  }
}
