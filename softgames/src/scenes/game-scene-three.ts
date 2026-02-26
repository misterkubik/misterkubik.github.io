import { Container, Graphics } from 'pixi.js'
import { SceneManager } from '../core/scene-manager'
import { ParticleEmitter } from '../components/particle-emitter'

export class GameSceneThree extends Container {
  public name = 'scene-three'
  private readonly background = new Graphics()
  private readonly fireLayer = new Container()
  private readonly brazier = new Graphics()
  private readonly emitter: ParticleEmitter
  constructor(private readonly sceneManager: SceneManager) {
    super()

    this.emitter = new ParticleEmitter({
      maxParticles: 10,
      spawnRate: 14,
      useGlobalTimeScale: true,
    })
      .add({
        name: 'spiral',
        textures: 'fire_{0-14}',
        scale: [1, 1.5],
        scaleOverLife: [0.5, 1, 1.5, 0.7],
        alphaOverLife: [0.95, 0.7, 1],
        // colorOverLife: [0xfff3b8, 0xff9e3a],
        colorOverLife: [ 0xffe8ad, 0xff7a22, 0xD12C14,  0x705450],
        life: [1, 2],
        velocity: [100, 250],
        velocityOverLife: [1, 1, 0.75, 0.45],
        vector: { x: [-0.25, 0.25], y: [-1, -0.9] },
        rotation: [-Math.PI, Math.PI],
        rotationVelocity: [-1, 1],
        originX: [-9, 9],
        originY: [-3, 3],
        chance: 20,
      })
      .add({
        name: 'sparks',
        textures: ['fire_dot', 'fire_2'],
        scale: [0.1, 0.2],
        alphaOverLife: [1, 0.6, 0.3, 1],
        color: [0xffe8ad, 0xff7a22],
        life: [0.2, 0.4],
        velocity: [200, 400],
        velocityOverLife: [1, 0.9, 0.65, 0.35],
        vector: { x: [-0.1, 0.1], y: [-1, -0.92] },
        originX: [-30, 30],
        originY: [-100, -150],
        chance: 40,
      })
      .add({
        name: 'glow',
        textures: 'fire_dot',
        scale: [1.4, 2.4],
        scaleOverLife: [0.3, 1.2, 0.7, 0.3],
        alphaOverLife: [0.6, 0.8, 0.3, 0],
        colorOverLife: [0xffe8ad, 0xff7a22, 0x8f1200],
        life: [0.8, 1.5],
        velocity: [120, 200],
        velocityOverLife: [1, 0.65, 0.95, 0.35],
        vector: { x: [-0.16, 0.16], y: [-1, -0.92] },
        rotation: [-Math.PI, Math.PI],
        rotationVelocity: [-1.5, 1.5],
        originX: [-10, 10],
        originY: [-5, -20],
        chance: 50,
      })

    this.drawBrazier()
    this.emitter.position.set(0, 110)
    this.fireLayer.addChild(this.brazier, this.emitter)
    this.addChild(this.background, this.fireLayer)
  }

  onEnter() {
    this.emitter.reset()
    this.layout()
  }

  onExit() {
    this.emitter.reset()
  }

  update(delta: number) {
    const width = this.sceneManager.width
    const height = this.sceneManager.height
    if (width === 0 || height === 0) {
      return
    }

    this.layout()
    this.emitter.update(delta)
  }

  private layout() {
    const width = this.sceneManager.width
    const height = this.sceneManager.height
    if (width === 0 || height === 0) {
      return
    }

    this.drawBackground(width, height)
    this.fireLayer.position.set(0, 40)
  }

  private drawBrazier() {
    const y = 110
    this.brazier.clear()
    this.brazier.beginFill(0x221812, 0.9)
    this.brazier.drawRoundedRect(-52, y + 10, 104, 26, 10)
    this.brazier.endFill()

    this.brazier.beginFill(0x3c2b21, 0.95)
    this.brazier.drawEllipse(0, y + 10, 44, 8)
    this.brazier.endFill()

    this.brazier.beginFill(0xff8f2b, 0.45)
    this.brazier.drawEllipse(0, y + 6, 34, 7)
    this.brazier.endFill()
  }

  private drawBackground(width: number, height: number) {
    this.background.clear()
    this.background.beginFill(0x0f1218, 1)
    this.background.drawRect(-width / 2, -height / 2, width, height)
    this.background.endFill()
  }
}
