import { Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { SceneManager } from '../core/scene-manager'
import { ChatBubble } from '../components/chat-bubble'
import Utils from '../core/utils'
import { beginLoading, endLoading } from '../core/loading-indicator'

type ApiTextureItem = {
  name: string
  url: string
  position?: string
}

type ApiChatLineItem = {
  name: string
  text: string
}

type MagicWordsResponse = {
  avatars?: ApiTextureItem[]
  emojies?: ApiTextureItem[]
  dialogue?: ApiChatLineItem[]
}

export class GameSceneTwo extends Container {
  public name = 'scene-two'
  private readonly chatViewport = new Container()
  private readonly chatContainer = new Container()
  private readonly chatMask = new Graphics()
  private readonly magicWordsUrl =
    'https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords'
  private readonly avatarTextures = new Map<string, Texture>()
  private readonly avatarPositions = new Map<string, 'left' | 'right'>()
  private readonly emojiTextures = new Map<string, Texture>()
  private readonly messages: ApiChatLineItem[] = []
  private readonly views: ChatBubble[] = []
  private objectUrls: string[] = []
  private requestId = 0
  private dialogueRunId = 0
  private readonly delayCalls: gsap.core.Tween[] = []
  private readonly typingTimelines: gsap.core.Timeline[] = []
  private lastWidth = 0
  private lastViewportWidth = 0
  private lastViewportHeight = 0
  private contentHeight = 0
  private readonly bottomInset = 10
  private isPinnedToBottom = true
  private isDragging = false
  private dragStartY = 0
  private dragStartContainerY = 0
  private readonly viewportPaddingX = 40
  private readonly viewportPaddingTop = 40
  private readonly viewportPaddingBottom = 28
  private readonly targetViewportWidth = 800
  private readonly targetMessageWidth = 500
  private readonly maskVerticalInset = 18

  constructor(private readonly sceneManager: SceneManager) {
    super()
    this.chatViewport.addChild(this.chatContainer)
    this.chatViewport.mask = this.chatMask
    this.chatViewport.eventMode = 'static'
    this.addChild(this.chatViewport, this.chatMask)
    this.bindScrollControls()
  }

  onEnter() {
    void this.enterScene()
  }

  onExit() {
    this.requestId += 1
    this.dialogueRunId += 1
    this.stopTimeline()
    this.chatContainer.removeChildren()
    this.chatMask.clear()
    this.views.length = 0
    this.messages.length = 0
    this.avatarTextures.clear()
    this.avatarPositions.clear()
    this.emojiTextures.clear()
    this.clearObjectUrls()
    this.isPinnedToBottom = true
    this.isDragging = false
  }

  update() {
    const width = this.sceneManager.width
    if (width !== this.lastWidth) {
      this.lastWidth = width
      this.rebuildVisibleViews()
      this.layoutMessages()
    }
  }

  private async enterScene() {
    this.visible = false
    this.renderable = false
    beginLoading()

    const currentRequest = ++this.requestId
    try {
      const response = await fetch(this.magicWordsUrl)
      if (!response.ok) {
        throw new Error(`Failed to load magic words: ${response.status}`)
      }

      const data = (await response.json()) as MagicWordsResponse
      if (currentRequest !== this.requestId) {
        return
      }

      await this.prepareTextures(data, currentRequest)
      if (currentRequest !== this.requestId) {
        return
      }

      this.messages.push(...this.parseDialogue(data))
      this.renderable = true
      this.visible = true
      this.layoutMessages()
      void this.playDialogue()
    } catch (error) {
      console.error('Error loading chat scene data:', error)
      this.renderable = true
      this.visible = true
    } finally {
      endLoading()
    }
  }

  private parseDialogue(data: MagicWordsResponse) {
    const list = Array.isArray(data.dialogue) ? data.dialogue : []
    return list.filter(
      (line): line is ApiChatLineItem =>
        !!line && typeof line.name === 'string' && typeof line.text === 'string'
    )
  }

  private async prepareTextures(data: MagicWordsResponse, currentRequest: number) {
    this.avatarTextures.clear()
    this.avatarPositions.clear()
    this.emojiTextures.clear()

    const avatars = Array.isArray(data.avatars) ? data.avatars : []
    const emojies = Array.isArray(data.emojies) ? data.emojies : []

    const avatarEntries = await this.loadTextureEntries(avatars, currentRequest)
    const emojiEntries = await this.loadTextureEntries(emojies, currentRequest)
    if (currentRequest !== this.requestId) {
      return
    }

    avatarEntries.forEach(([name, texture]) => this.avatarTextures.set(name, texture))
    avatars.forEach((avatar) => {
      const side = avatar.position === 'left' ? 'left' : avatar.position === 'right' ? 'right' : null
      if (side) {
        this.avatarPositions.set(avatar.name, side)
      }
    })
    emojiEntries.forEach(([name, texture]) => this.emojiTextures.set(name, texture))
  }

  private async loadTextureEntries(items: ApiTextureItem[], currentRequest: number) {
    const validItems = items.filter(
      (item): item is ApiTextureItem =>
        !!item && typeof item.name === 'string' && typeof item.url === 'string'
    )

    const results = await Promise.allSettled(
      validItems.map(async (item) => {
        const texture = await this.loadTextureFromUrl(item.url)
        return [item.name, texture] as const
      })
    )

    if (currentRequest !== this.requestId) {
      return [] as Array<readonly [string, Texture]>
    }

    return results
      .filter(
        (result): result is PromiseFulfilledResult<readonly [string, Texture]> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value)
  }

  private async loadTextureFromUrl(url: string) {
    const normalizedUrl = this.normalizeRemoteTextureUrl(url)
    const response = await fetch(normalizedUrl)
    if (!response.ok) {
      throw new Error(`Texture fetch failed: ${response.status} ${normalizedUrl}`)
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    this.objectUrls.push(objectUrl)

    const texture = Texture.from(objectUrl)
    if (texture.baseTexture.valid) {
      return texture
    }

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup()
        resolve()
      }
      const onError = (error: unknown) => {
        cleanup()
        reject(error)
      }
      const cleanup = () => {
        texture.baseTexture.off('loaded', onLoaded)
        texture.baseTexture.off('error', onError)
      }
      texture.baseTexture.once('loaded', onLoaded)
      texture.baseTexture.once('error', onError)
    })

    return texture
  }

  private normalizeRemoteTextureUrl(url: string) {
    try {
      const parsed = new URL(url)
      if (parsed.hostname === 'api.dicebear.com' && parsed.port === '81') {
        parsed.port = ''
      }
      return parsed.toString()
    } catch {
      return url
    }
  }

  private async playDialogue() {
    this.stopTimeline()
    this.chatContainer.removeChildren()
    this.views.length = 0
    const runId = ++this.dialogueRunId

    for (let index = 0; index < this.messages.length; index += 1) {
      if (runId !== this.dialogueRunId) {
        return
      }
      const line = this.messages[index]
      const bubble = await this.showMessage(line, runId)
      if (runId !== this.dialogueRunId) {
        return
      }

      if (bubble.side === 'left') {
        const typing = bubble.buildTypingTimeline(0.12, () => this.layoutMessages())
        this.typingTimelines.push(typing)
        await this.waitForTimeline(typing)
        if (runId !== this.dialogueRunId) {
          return
        }
      }

      if (index < this.messages.length - 1) {
        await this.waitSeconds(2)
        if (runId !== this.dialogueRunId) {
          return
        }
      }
    }
  }

  private async showMessage(line: ApiChatLineItem, runId: number) {
    const bubble = this.createMessageBubble(line)
    this.views.push(bubble)
    this.chatContainer.addChild(bubble)
    this.layoutMessages()
    if (bubble.side === 'right') {
      bubble.showTypingState()
      this.layoutMessages()
      await this.waitSeconds(this.getTypingDelay(line.text))
      if (runId !== this.dialogueRunId || bubble.destroyed || !bubble.parent) {
        return bubble
      }
      bubble.showMessageState()
      this.layoutMessages()
      bubble.playBubbleScaleUp()
    }
    return bubble
  }

  private createMessageBubble(line: ApiChatLineItem) {
    const side = this.avatarPositions.get(line.name) ?? 'right'
    return new ChatBubble({
      name: line.name,
      text: line.text,
      side,
      avatarTexture: this.getAvatarTexture(line.name),
      wrapWidth: this.getMessageWrapWidth(),
      getEmojiSprite: (name) => this.getEmojiSprite(name),
    })
  }

  private rebuildVisibleViews() {
    if (this.views.length === 0) {
      return
    }
    this.stopTypingTimelines()

    const rebuilt: ChatBubble[] = []
    for (let i = 0; i < this.views.length; i += 1) {
      const oldBubble = this.views[i]
      const name = this.messages[i]?.name ?? ''
      const text = this.messages[i]?.text ?? ''
      oldBubble.destroy({ children: true })
      rebuilt.push(this.createMessageBubble({ name, text }))
    }

    this.chatContainer.removeChildren()
    rebuilt.forEach((bubble) => this.chatContainer.addChild(bubble))
    this.views.length = 0
    this.views.push(...rebuilt)
  }

  private layoutMessages() {
    const width = this.sceneManager.width
    const height = this.sceneManager.height
    if (width === 0 || height === 0) {
      return
    }

    const messageGap = 16
    const viewportWidth = Utils.clamp(
      width - this.viewportPaddingX * 2,
      Number.NEGATIVE_INFINITY,
      this.targetViewportWidth
    )
    const viewportHeight = Utils.clamp(
      height - this.viewportPaddingTop - this.viewportPaddingBottom,
      100,
      Number.POSITIVE_INFINITY
    )
    const viewportX = -viewportWidth / 2
    const viewportY = -height / 2 + this.viewportPaddingTop

    this.chatViewport.position.set(viewportX, viewportY)
    this.chatViewport.hitArea = new Rectangle(0, 0, viewportWidth, viewportHeight)
    this.lastViewportWidth = viewportWidth
    this.lastViewportHeight = viewportHeight
    const maskX = -width / 2
    const maskWidth = width
    this.chatMask.clear()
    this.chatMask.beginFill(0xffffff)
    this.chatMask.drawRect(
      maskX,
      viewportY - this.maskVerticalInset,
      maskWidth,
      viewportHeight + this.maskVerticalInset * 2
    )
    this.chatMask.endFill()

    let y = 0
    for (const bubble of this.views) {
      const x = bubble.side === 'left' ? 10 : viewportWidth - 10 - bubble.rowWidth
      bubble.position.set(x, y)
      y += bubble.rowHeight + messageGap
    }

    this.contentHeight = Utils.clamp(y - messageGap, 0, Number.POSITIVE_INFINITY)
    if (this.isPinnedToBottom) {
      this.chatContainer.position.set(0, this.getMinContainerY())
    } else {
      this.chatContainer.position.set(0, this.clampContainerY(this.chatContainer.position.y))
    }
    this.applyCulling(viewportHeight)
    this.applyTopFade()
  }

  private applyCulling(viewportHeight: number) {
    const buffer = 80 + this.maskVerticalInset
    for (const bubble of this.views) {
      const top = bubble.position.y + this.chatContainer.position.y
      const bottom = top + bubble.rowHeight
      const inView = bottom > -buffer && top < viewportHeight + buffer
      bubble.visible = inView
      bubble.renderable = inView
    }
  }

  private getMessageWrapWidth() {
    const width = this.sceneManager.width
    if (width === 0) {
      return this.targetMessageWidth
    }
    const viewportWidth = Utils.clamp(
      width - this.viewportPaddingX * 2,
      Number.NEGATIVE_INFINITY,
      this.targetViewportWidth
    )
    const bubbleLeft = 64
    const bubblePaddingX = 14
    const available = viewportWidth - 10 - bubbleLeft - bubblePaddingX * 2 - 20
    return Utils.clamp(Math.floor(available), 220, this.targetMessageWidth)
  }

  private applyTopFade() {
    if (this.views.length === 0) {
      return
    }

    for (const bubble of this.views) {
      bubble.alpha = 1
    }

    const fadeZoneHeight = 140
    const minAlpha = 0.2

    for (const bubble of this.views) {
      if (!bubble.visible) {
        continue
      }
      const top = bubble.position.y + this.chatContainer.position.y + this.maskVerticalInset
      const bottom = top + bubble.rowHeight

      if (bottom <= 0) {
        bubble.alpha = minAlpha
        continue
      }

      if (top >= fadeZoneHeight) {
        bubble.alpha = 1
        continue
      }

      const factor = Utils.clamp(top / fadeZoneHeight, 0, 1)
      bubble.alpha = minAlpha + (1 - minAlpha) * factor
    }
  }

  private bindScrollControls() {
    this.chatViewport.on('wheel', (event) => {
      const deltaY = (event as unknown as { deltaY?: number }).deltaY ?? 0
      if (deltaY === 0) {
        return
      }
      this.isPinnedToBottom = false
      this.setContainerY(this.chatContainer.position.y - deltaY * 0.8)
      this.applyCulling(this.lastViewportHeight)
      this.applyTopFade()
      event.stopPropagation()
    })

    this.chatViewport.on('pointerdown', (event) => {
      this.isDragging = true
      this.isPinnedToBottom = false
      this.dragStartY = event.global.y
      this.dragStartContainerY = this.chatContainer.position.y
    })

    this.chatViewport.on('pointermove', (event) => {
      if (!this.isDragging) {
        return
      }
      const dy = event.global.y - this.dragStartY
      this.setContainerY(this.dragStartContainerY + dy)
      this.applyCulling(this.lastViewportHeight)
      this.applyTopFade()
    })

    this.chatViewport.on('pointerup', () => {
      this.finishDrag()
    })
    this.chatViewport.on('pointerupoutside', () => {
      this.finishDrag()
    })
  }

  private finishDrag() {
    if (!this.isDragging) {
      return
    }
    this.isDragging = false
    this.isPinnedToBottom =
      Utils.distanceXY(0, 0, this.chatContainer.position.y - this.getMinContainerY(), 0) < 2
  }

  private setContainerY(nextY: number) {
    this.chatContainer.position.y = this.clampContainerY(nextY)
    this.isPinnedToBottom =
      Utils.distanceXY(0, 0, this.chatContainer.position.y - this.getMinContainerY(), 0) < 2
  }

  private getMinContainerY() {
    return this.lastViewportHeight - this.contentHeight - this.bottomInset
  }

  private clampContainerY(value: number) {
    const minY = this.getMinContainerY()
    const maxY = 0
    if (minY > maxY) {
      return minY
    }
    return Utils.clamp(value, minY, maxY)
  }

  private stopTimeline() {
    this.dialogueRunId += 1
    for (const delay of this.delayCalls) {
      delay.kill()
    }
    this.delayCalls.length = 0
    this.stopTypingTimelines()
  }

  private stopTypingTimelines() {
    for (const typing of this.typingTimelines) {
      typing.kill()
    }
    this.typingTimelines.length = 0
  }

  private waitForTimeline(timeline: gsap.core.Timeline) {
    return new Promise<void>((resolve) => {
      timeline.eventCallback('onComplete', () => resolve())
    })
  }

  private waitSeconds(seconds: number) {
    return new Promise<void>((resolve) => {
      const tween = gsap.to({}, { duration: seconds, onComplete: resolve })
      this.delayCalls.push(tween)
    })
  }

  private getTypingDelay(text: string) {
    const length = text.trim().length
    const minDelay = 0.45
    const maxDelay = 4.5
    const seconds = 0.1 + length * 0.03
    return Utils.clamp(seconds, minDelay, maxDelay)
  }

  private clearObjectUrls() {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url)
    }
    this.objectUrls = []
  }

  private getAvatarTexture(name: string) {
    return (
      this.avatarTextures.get(name) ??
      this.getLocalTexture('avatar') ??
      Texture.WHITE
    )
  }

  private getEmojiSprite(name: string) {
    const texture = this.emojiTextures.get(name) ?? this.getLocalTexture('emoji')
    return texture ? new Sprite(texture) : null
  }

  private getLocalTexture(name: string) {
    const asset = Assets.get(name)
    return asset instanceof Texture ? asset : null
  }
}
