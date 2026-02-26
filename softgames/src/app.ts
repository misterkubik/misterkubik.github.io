import { Application } from 'pixi.js'
import { gsap } from 'gsap'
import { SceneManager } from './core/scene-manager'
import { loadAssets } from './core/asset-loader'
import { beginLoading, endLoading, initLoadingIndicator } from './core/loading-indicator'
import { GameSceneOne } from './scenes/game-scene-one'
import { GameSceneTwo } from './scenes/game-scene-two'
import { GameSceneThree } from './scenes/game-scene-three'
import Utils from './core/utils'

export class App {
  private readonly app: Application
  private readonly sceneManager: SceneManager
  private menuSceneButtons: HTMLButtonElement[] = []
  private isPseudoFullscreen = false
  private readonly handleWindowResize = () => {
    this.updateViewportUnit()
    this.resizeRendererToRoot()
  }
  private readonly handleFullscreenChange = () => {
    this.updateViewportUnit()
    this.resizeRendererToRoot()
    requestAnimationFrame(() => this.resizeRendererToRoot())
  }
  private readonly sceneBackgrounds: Record<string, [string, string, string]> = {
    'scene-one': ['#4d8a4f', '#2f6f3a', '#204f29'],
    'scene-two': ['#fdf2df', '#f2dcb9', '#e6bc84'],
    'scene-three': ['#1a212d', '#111720', '#090c12'],
  }

  constructor(private readonly root: HTMLDivElement) {
    this.app = new Application({
      resizeTo: root,
      backgroundColor: 0xf8f2e9,
      antialias: true,
      autoDensity: true,
      resolution: Utils.clamp(window.devicePixelRatio || 1, 1, 2),
    })

    // @ts-ignore
    globalThis.__PIXI_APP__ = this.app;

    this.sceneManager = new SceneManager(this.app)
  }

  async start() {
    const view =
      (this.app as unknown as { view?: HTMLCanvasElement }).view ??
      (this.app as unknown as { canvas?: HTMLCanvasElement }).canvas ??
      (this.app.renderer as unknown as { view?: HTMLCanvasElement }).view

    if (!(view instanceof HTMLCanvasElement)) {
      throw new Error('Pixi view is not an HTMLCanvasElement')
    }

    this.updateViewportUnit()
    this.root.appendChild(view)
    this.resizeRendererToRoot()
    window.addEventListener('resize', this.handleWindowResize)
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    window.visualViewport?.addEventListener('resize', this.handleWindowResize)
    window.addEventListener('orientationchange', this.handleWindowResize)
    this.addOverlay()
    this.stabilizeInitialLayout()
    beginLoading()
    try {
      await loadAssets()
    } finally {
      endLoading()
    }
    this.registerScenes()
    const savedScene = this.getSavedScene()
    const initialScene = savedScene ?? 'scene-one'
    this.changeScene(initialScene)
    this.markActiveSceneButton(initialScene)
  }

  private resizeRendererToRoot() {
    const width = Utils.clamp(Math.round(this.root.clientWidth), 1, Number.POSITIVE_INFINITY)
    const height = Utils.clamp(Math.round(this.root.clientHeight), 1, Number.POSITIVE_INFINITY)
    this.app.renderer.resize(width, height)
  }

  private updateViewportUnit() {
    const vh = (window.visualViewport?.height ?? window.innerHeight) * 0.01
    document.documentElement.style.setProperty('--app-vh', `${vh}px`)
  }

  private stabilizeInitialLayout() {
    const sync = () => {
      this.updateViewportUnit()
      this.resizeRendererToRoot()
    }
    requestAnimationFrame(sync)
    setTimeout(sync, 80)
    setTimeout(sync, 260)
  }

  private get isNativeFullscreen() {
    return document.fullscreenElement === this.root
  }

  private get isFullscreenActive() {
    return this.isNativeFullscreen || this.isPseudoFullscreen
  }

  private setPseudoFullscreen(enabled: boolean) {
    this.isPseudoFullscreen = enabled
    this.root.classList.toggle('is-pseudo-fullscreen', enabled)
    document.body.classList.toggle('is-pseudo-fullscreen', enabled)
  }

  private addOverlay() {
    const menu = document.createElement('div')
    menu.className = 'menu'
    menu.innerHTML = `
      <button class="menu__button" type="button">Scenes</button>
      <div class="menu__list" role="menu">
        <button type="button" data-scene="scene-one">1. Ace of Shadows</button>
        <button type="button" data-scene="scene-two">2. Magic Words</button>
        <button type="button" data-scene="scene-three">3. Phoenix Flame</button>
      </div>
    `

    const toggleButton = menu.querySelector<HTMLButtonElement>('.menu__button')
    const list = menu.querySelector<HTMLDivElement>('.menu__list')
    this.menuSceneButtons = Array.from(
      menu.querySelectorAll<HTMLButtonElement>('.menu__list button[data-scene]')
    )

    if (toggleButton && list) {
      toggleButton.addEventListener('click', () => {
        list.classList.toggle('menu__list--open')
        toggleButton.classList.toggle('is-open')
      })

      list.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        const scene = target?.dataset?.scene
        if (scene) {
          this.changeScene(scene)
          this.markActiveSceneButton(scene)
          this.saveScene(scene)
          list.classList.remove('menu__list--open')
          toggleButton.classList.remove('is-open')
        }
      })

      document.addEventListener('click', (event) => {
        if (!menu.contains(event.target as Node)) {
          list.classList.remove('menu__list--open')
          toggleButton.classList.remove('is-open')
        }
      })
    }

    const fps = document.createElement('div')
    fps.className = 'fps'
    fps.innerHTML = `<span class="fps__label">FPS:</span> <span class="fps__value">--</span>`
    const fpsValueNode = fps.querySelector<HTMLSpanElement>('.fps__value')

    const speedControl = document.createElement('div')
    speedControl.className = 'speed-control'
    speedControl.innerHTML = `
      <label class="label" for="speed-slider">Time Scale: <span class="value">1.00x</span></label>
      <button type="button" class="reset">Reset</button>
      <input id="speed-slider" class="slider" type="range" min="0" max="1" step="0.001" value="0.5" />
    `

    const speedValue = speedControl.querySelector<HTMLSpanElement>('span.value')
    const speedSlider = speedControl.querySelector<HTMLInputElement>('#speed-slider')
    const resetButton = speedControl.querySelector<HTMLButtonElement>('button.reset')
    if (speedSlider && speedValue && resetButton) {
      const speedPoints = [0, 1, 10]
      const defaultProgress = 0.5

      const applyProgress = (progress: number) => {
        const value = Utils.lerpArray(progress, speedPoints)
        gsap.globalTimeline.timeScale(value)
        speedValue.textContent = `${value.toFixed(2)}x`
      }

      speedSlider.value = String(defaultProgress)
      applyProgress(defaultProgress)

      speedSlider.addEventListener('input', () => {
        const progress = Number(speedSlider.value)
        applyProgress(Number.isFinite(progress) ? progress : defaultProgress)
      })

      resetButton.addEventListener('click', () => {
        speedSlider.value = String(defaultProgress)
        applyProgress(defaultProgress)
      })
    }

    const loading = document.createElement('div')
    loading.className = 'loading'
    loading.innerHTML = `
      <div class="loading__spinner"></div>
    `
    initLoadingIndicator(loading)

    const fullscreenButton = document.createElement('button')
    fullscreenButton.className = 'fullscreen-toggle'
    fullscreenButton.type = 'button'
    const activeFullscreenIcon = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14 20v-6h6" />
        <path d="M4 10h6v-6" />
        <path d="M4 4 10 10" />
        <path d="M20 20 14 14" />
      </svg>
    `
    const defaultFullscreenIcon = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M10 4H4v6" />
        <path d="M14 20h6v-6" />
        <path d="M4 4 10 10" />
        <path d="M20 20 14 14" />
      </svg>
    `
    fullscreenButton.innerHTML = defaultFullscreenIcon

    const syncFullscreenButton = () => {
      const isFullscreen = this.isFullscreenActive
      const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
      fullscreenButton.setAttribute('aria-label', label)
      fullscreenButton.title = label
      fullscreenButton.classList.toggle('is-active', isFullscreen)
      fullscreenButton.innerHTML = isFullscreen ? activeFullscreenIcon : defaultFullscreenIcon
    }

    fullscreenButton.addEventListener('click', async () => {
      try {
        if (this.isNativeFullscreen) {
          await document.exitFullscreen()
        } else if (this.isPseudoFullscreen) {
          this.setPseudoFullscreen(false)
        } else {
          const requestFullscreen = this.root.requestFullscreen?.bind(this.root)
          if (requestFullscreen) {
            await requestFullscreen()
          } else {
            this.setPseudoFullscreen(true)
          }
        }
      } catch (error) {
        this.setPseudoFullscreen(!this.isPseudoFullscreen)
        console.error('Fullscreen toggle failed, switched to fallback:', error)
      } finally {
        this.resizeRendererToRoot()
        requestAnimationFrame(() => this.resizeRendererToRoot())
        syncFullscreenButton()
      }
    })

    document.addEventListener('fullscreenchange', syncFullscreenButton)
    syncFullscreenButton()

    this.root.appendChild(menu)
    this.root.appendChild(fps)
    this.root.appendChild(speedControl)
    this.root.appendChild(fullscreenButton)
    this.root.appendChild(loading)

    let lastTime = performance.now()
    let frames = 0
    this.app.ticker.add(() => {
      frames += 1
      const now = performance.now()
      if (now - lastTime >= 500) {
        const fpsValue = Math.round((frames * 1000) / (now - lastTime))
        if (fpsValueNode) {
          fpsValueNode.textContent = String(fpsValue)
        }
        frames = 0
        lastTime = now
      }
    })
  }

  private registerScenes() {
    this.sceneManager.register('scene-one', new GameSceneOne(this.sceneManager))
    this.sceneManager.register('scene-two', new GameSceneTwo(this.sceneManager))
    this.sceneManager.register('scene-three', new GameSceneThree(this.sceneManager))
  }

  private saveScene(scene: string) {
    localStorage.setItem('activeScene', scene)
  }

  private getSavedScene() {
    return localStorage.getItem('activeScene')
  }

  private changeScene(scene: string) {
    this.sceneManager.change(scene)
    this.applySceneBackground(scene)
  }

  private applySceneBackground(scene: string) {
    const [top, mid, bottom] = this.sceneBackgrounds[scene] ?? this.sceneBackgrounds['scene-one']
    const style = document.documentElement.style
    style.setProperty('--scene-bg-top', top)
    style.setProperty('--scene-bg-mid', mid)
    style.setProperty('--scene-bg-bottom', bottom)
  }

  private markActiveSceneButton(scene: string) {
    this.menuSceneButtons.forEach((button) => {
      const isActive = button.dataset.scene === scene
      button.classList.toggle('is-active', isActive)
      if (isActive) {
        button.setAttribute('aria-current', 'true')
      } else {
        button.removeAttribute('aria-current')
      }
    })
  }
}
