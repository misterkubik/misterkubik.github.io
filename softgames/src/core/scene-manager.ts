import { Application, Container } from 'pixi.js'

export interface Scene {
  name: string
  onEnter?(): void
  onExit?(): void
  update?(delta: number): void
}

export class SceneManager {
  private readonly scenes = new Map<string, Scene>()
  private currentScene: Scene | null = null
  private readonly stage: Container

  constructor(private readonly app: Application) {
    this.stage = app.stage
    app.ticker.add((delta) => {
      this.syncSceneTransform()
      if (this.currentScene?.update) {
        this.currentScene.update(delta)
      }
    })
  }

  register(key: string, scene: Scene) {
    this.scenes.set(key, scene)
  }

  get width() {
    return this.app.screen.width
  }

  get height() {
    return this.app.screen.height
  }

  get renderer() {
    return this.app.renderer
  }

  change(key: string) {
    const next = this.scenes.get(key)
    if (!next) {
      throw new Error(`Scene "${key}" not found`)
    }

    if (this.currentScene === next) {
      return
    }

    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit()
    }

    this.stage.removeChildren()
    this.currentScene = next
    const container = next as unknown as Container
    this.stage.addChild(container)
    this.syncSceneTransform()

    if (this.currentScene.onEnter) {
      this.currentScene.onEnter()
    }
  }

  private syncSceneTransform() {
    if (!this.currentScene) {
      return
    }
    const container = this.currentScene as unknown as Container
    container.position.set(this.width / 2, this.height / 2)
  }
}
