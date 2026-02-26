import { Assets, Container, Graphics, Text, TextStyle, Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { SceneManager } from '../core/scene-manager'
import { Card } from '../components/card'
import Utils from '../core/utils'

export class GameSceneOne extends Container {
  public name = 'scene-one'
  private readonly tableBackground = new Graphics()
  private readonly stackLeft: Container
  private readonly stackRight: Container
  private readonly leftCounter = new Container()
  private readonly rightCounter = new Container()
  private readonly leftCounterFrame = new Graphics()
  private readonly rightCounterFrame = new Graphics()
  private readonly leftCounterText: Text
  private readonly rightCounterText: Text
  private readonly leftCards: Card[] = []
  private readonly rightCards: Card[] = []
  private readonly rightCardTransforms = new Map<Card, { x: number; y: number; rotation: number }>()
  private built = false
  private cardsAmount: number = 144
  private movingCard: Card | null = null
  private nextMoveCall: gsap.core.Tween | null = null
  private rightCounterLeadCall: gsap.core.Tween | null = null
  private rightCounterLead = 0

  constructor(private readonly sceneManager: SceneManager) {
    super()
    const counterStyle = new TextStyle({
      fontFamily: 'Fixel, sans-serif',
      fontWeight: '700',
      fontSize: 22,
      fill: 0x1b1c21,
    })
    this.leftCounterText = new Text('0', counterStyle)
    this.rightCounterText = new Text('0', counterStyle)
    this.leftCounterText.anchor.set(0.5)
    this.rightCounterText.anchor.set(0.5)

    this.stackLeft = new Container()
    this.stackRight = new Container()
    this.leftCounter.addChild(this.leftCounterFrame, this.leftCounterText)
    this.rightCounter.addChild(this.rightCounterFrame, this.rightCounterText)

    this.addChild(this.tableBackground, this.stackLeft, this.stackRight, this.leftCounter, this.rightCounter)
  }

  onEnter() {
    this.ensureStacks()
    this.resetStacks()
    this.layout()
    this.moveNextCard()
  }

  update(delta: number) {
    const width = this.sceneManager.width
    const height = this.sceneManager.height
    if (width === 0 || height === 0) {
      return
    }

    this.layout()
  }

  onExit() {
    this.stopMoving()
  }

  private layout() {
    const width = this.sceneManager.width
    const height = this.sceneManager.height
    if (width === 0 || height === 0) {
      return
    }

    const halfW = width / 2
    const halfH = height / 2
    this.drawTableBackground(width, height)

    let leftX = -halfW + width * 0.35
    let rightX = -halfW + width * 0.65
    const minStackGap = 200
    if (rightX - leftX < minStackGap) {
      const centerX = -halfW + width * 0.5
      leftX = centerX - minStackGap / 2
      rightX = centerX + minStackGap / 2
    }

    this.stackLeft.position.set(leftX, -halfH + height * 0.55)
    this.stackRight.position.set(rightX, -halfH + height * 0.55)
    this.leftCounter.position.set(this.stackLeft.x, this.stackLeft.y - 140)
    this.rightCounter.position.set(this.stackRight.x, this.stackRight.y - 140)

    this.restackLeft(this.leftCards)
    this.restackRight(this.rightCards)
    this.updateCounters()
  }

  private ensureStacks() {
    if (this.built) {
      return
    }
    const textureBack = Assets.get('card_back')
    for (let i = 0; i < this.cardsAmount; i += 1) {
      const card = new Card()
      const texture = this.getCardTexture(i)
      if (texture) {
        card.textureFront = texture
      }
      card.textureBack = textureBack
      this.resetCardFlipState(card)
      this.leftCards.push(card)
      this.stackLeft.addChild(card)
    }
    this.restackLeft(this.leftCards)
    this.built = true
  }

  private getCardTexture(index: number) {
    const key = `card_${(this.cardsAmount - index - 1) % 51}`
    const asset = Assets.get(key)
    return asset instanceof Texture ? asset : null
  }

  private restackLeft(cards: Card[]) {
    const maxOffset = 24
    cards.forEach((card, index) => {
      const clamped = Math.min(index, maxOffset)
      card.position.set(clamped * 0.6, -clamped * 0.8)
      card.rotation = 0
    })
  }

  private restackRight(cards: Card[]) {
    const maxOffset = 24
    cards.forEach((card, index) => {
      const clamped = Math.min(index, maxOffset)
      const transform = this.getRightTransform(card)
      card.position.set(clamped * 0.6 + transform.x, -clamped * 0.8 + transform.y)
      card.rotation = transform.rotation
    })
  }

  private moveNextCard() {
    const next = this.leftCards.pop()
    if (!next) {
      this.movingCard = null
      return
    }

    this.movingCard = next
    this.updateCounters()
    const fromGlobal = next.getGlobalPosition()
    const fromScene = this.toLocal(fromGlobal)
    this.stackLeft.removeChild(next)
    this.addChild(next)
    next.position.set(fromScene.x, fromScene.y)
    next.foldAngle = Utils.random(Math.PI * 2)
    next.foldForce = 0.8
    next.progress = 0

    const targetLocal = this.getStackPosition(this.rightCards.length)
    const targetGlobal = this.stackRight.toGlobal(targetLocal)
    const targetScene = this.toLocal(targetGlobal)
    const targetRotation = this.getRightTransform(next).rotation

    gsap.to(next, {
      progress: 1,
      duration: 1.5,
      ease: 'power2.out',
    })

    gsap.to(next, {
      x: targetScene.x,
      y: targetScene.y,
      rotation: targetRotation,
      duration: 2,
      ease: 'power2.out',
      onStart: () => {
        if (this.rightCounterLeadCall) {
          this.rightCounterLeadCall.kill()
          this.rightCounterLeadCall = null
        }
        this.rightCounterLead = 0
        this.rightCounterLeadCall = gsap.delayedCall(1.2, () => {
          this.rightCounterLead = 1
          this.rightCounterLeadCall = null
          this.updateCounters()
        })
      },
      onComplete: () => {
        this.removeChild(next)
        this.stackRight.addChild(next)
        next.position.set(targetLocal.x, targetLocal.y)
        this.rightCards.push(next)
        this.rightCounterLead = 0
        if (this.rightCounterLeadCall) {
          this.rightCounterLeadCall.kill()
          this.rightCounterLeadCall = null
        }
        this.updateCounters()
        this.movingCard = null
        this.nextMoveCall = gsap.delayedCall(0.2, () => {
          this.nextMoveCall = null
          this.moveNextCard()
        })
      },
    })
  }

  private getStackPosition(index: number) {
    const clamped = Math.min(index, 24)
    return this.withRightTransform({ x: clamped * 0.6, y: -clamped * 0.8 }, this.movingCard)
  }

  private withRightTransform(position: { x: number; y: number }, card: Card | null) {
    if (!card) {
      return position
    }
    const transform = this.getRightTransform(card)
    return {
      x: position.x + transform.x,
      y: position.y + transform.y,
    }
  }

  private getRightTransform(card: Card) {
    let transform = this.rightCardTransforms.get(card)
    if (!transform) {
      const maxOffset = 10
      const maxDeg = 15
      transform = {
        x: Utils.random(-maxOffset, maxOffset),
        y: Utils.random(-maxOffset, maxOffset),
        rotation: (Utils.random(-maxDeg, maxDeg) * Math.PI) / 180,
      }
      this.rightCardTransforms.set(card, transform)
    }
    return transform
  }

  private resetStacks() {
    this.stopMoving()
    while (this.rightCards.length > 0) {
      const card = this.rightCards.pop()
      if (!card) {
        break
      }
      this.stackRight.removeChild(card)
      this.rightCardTransforms.delete(card)
      this.resetCardFlipState(card)
      this.stackLeft.addChild(card)
      this.leftCards.push(card)
    }
    this.leftCards.forEach((card) => this.resetCardFlipState(card))
    this.restackLeft(this.leftCards)
    this.restackRight(this.rightCards)
    this.updateCounters()
  }

  private stopMoving() {
    if (this.nextMoveCall) {
      this.nextMoveCall.kill()
      this.nextMoveCall = null
    }
    if (this.rightCounterLeadCall) {
      this.rightCounterLeadCall.kill()
      this.rightCounterLeadCall = null
    }
    this.rightCounterLead = 0
    if (this.movingCard) {
      gsap.killTweensOf(this.movingCard)
      if (this.movingCard.parent === this) {
        this.removeChild(this.movingCard)
        this.rightCardTransforms.delete(this.movingCard)
        this.resetCardFlipState(this.movingCard)
        this.stackLeft.addChild(this.movingCard)
        this.leftCards.push(this.movingCard)
      }
    }
    this.movingCard = null
  }

  private updateCounters() {
    this.leftCounterText.text = String(this.getLeftCount())
    this.rightCounterText.text = String(this.getRightCount())
    this.drawCounterFrame(this.leftCounterFrame)
    this.drawCounterFrame(this.rightCounterFrame)
    this.leftCounterText.position.set(0, 0)
    this.rightCounterText.position.set(0, 0)
  }

  private getLeftCount() {
    return this.leftCards.length
  }

  private getRightCount() {
    return this.rightCards.length + this.rightCounterLead
  }

  private drawCounterFrame(frame: Graphics) {
    const w = 92
    const h = 52
    frame.clear()
    frame.lineStyle(2, 0x1b1c21, 0.95)
    frame.beginFill(0xffffff, 0.9)
    frame.drawRoundedRect(-w / 2, -h / 2, w, h, 12)
    frame.endFill()
  }

  private drawTableBackground(width: number, height: number) {
    this.tableBackground.clear()
    this.tableBackground.beginFill(0x2f6f3a, 1)
    this.tableBackground.drawRect(-width / 2, -height / 2, width, height)
    this.tableBackground.endFill()
  }

  private resetCardFlipState(card: Card) {
    card.progress = 0
    card.foldSymmetry = 1
    card.foldForce = 0.6
    card.dim = 0
  }
}
