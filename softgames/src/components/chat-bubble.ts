import { Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { RichTextLine } from './rich-text-line'
import Utils from '../core/utils'

type ChatSide = 'left' | 'right'

type ChatBubbleOptions = {
  name: string
  text: string
  side: ChatSide
  avatarTexture: Texture
  wrapWidth: number
  getEmojiSprite: (name: string) => Sprite | null
}

export class ChatBubble extends Container {
  public get rowHeight() {
    return this.currentRowHeight
  }
  public get rowWidth() {
    return this.currentRowWidth
  }
  public readonly side: ChatSide
  public readonly body: RichTextLine
  private readonly bubbleLayer = new Container()
  private readonly bubbleFrame = new Graphics()
  private readonly avatarFrame = new Graphics()
  private readonly nameLabel: Text
  private readonly typingLabel: Text
  private readonly displayName: string
  private readonly fullText: string
  private readonly emojiFactory: (name: string) => Sprite | null
  private readonly avatar: Sprite
  private readonly avatarSize = 48
  private currentRowHeight: number
  private currentRowWidth: number

  private readonly bubbleLeft = 64
  private readonly bubblePaddingX = 14
  private readonly bubblePaddingY = 10
  private readonly nameGap = 6
  private readonly typingOffset = 12

  constructor(options: ChatBubbleOptions) {
    super()
    this.side = options.side
    this.displayName = options.name
    this.fullText = options.text
    this.emojiFactory = options.getEmojiSprite

    const avatarSize = this.avatarSize
    const avatarRadius = avatarSize / 2
    const avatarCenterX = avatarRadius
    this.avatar = new Sprite(options.avatarTexture)
    this.avatar.width = avatarSize
    this.avatar.height = avatarSize

    const style = new TextStyle({
      fontFamily: 'Fixel, sans-serif',
      fontWeight: '500',
      fontSize: 22,
      fill: 0x000000,
      lineHeight: 30,
      wordWrap: true,
      wordWrapWidth: options.wrapWidth,
    })

    const nameStyle = new TextStyle({
      fontFamily: 'Fixel, sans-serif',
      fontSize: 14,
      fontWeight: '700',
      fill: this.side === 'left' ? 0x2e86ab : 0xee6b4d,
    })
    this.nameLabel = new Text(options.name, nameStyle)
    this.typingLabel = new Text(`${options.name} is typing...`, new TextStyle({
      fontFamily: 'Fixel, sans-serif',
      fontSize: 13,
      fontWeight: '500',
      fill: 0x6f7276,
    }))

    this.body = new RichTextLine(options.text, style)
    this.body.compose((name) => options.getEmojiSprite(name))
    this.body.pivot.set(0, 0)
    this.currentRowHeight = avatarSize
    this.currentRowWidth = this.bubbleLeft + this.bubblePaddingX * 2

    this.avatarFrame.lineStyle(3, 0x1f1f1f, 0.9)
    this.avatarFrame.beginFill(0xffffff, 0)
    this.avatarFrame.drawCircle(avatarCenterX, avatarCenterX, avatarRadius + 1)
    this.avatarFrame.endFill()

    if (this.side === 'left') {
      this.nameLabel.anchor.set(0, 0)
      this.nameLabel.position.set(this.bubbleLeft + this.bubblePaddingX, this.bubblePaddingY)
      this.body.position.set(
        this.bubbleLeft + this.bubblePaddingX,
        this.bubblePaddingY + this.nameLabel.height + this.nameGap
      )
      this.bubbleFrame.position.set(this.bubbleLeft, 0)
      this.avatar.position.set(0, 0)
      this.bubbleLayer.pivot.set(this.bubbleLeft, 0)
      this.bubbleLayer.position.set(this.bubbleLeft, 0)
      this.typingLabel.anchor.set(0, 0)
      this.typingLabel.position.set(
        this.bubbleLeft + this.bubblePaddingX,
        avatarSize - this.typingLabel.height
      )
    } else {
      this.nameLabel.anchor.set(1, 0)
      this.nameLabel.position.set(0, this.bubblePaddingY)
      this.bubbleFrame.position.set(0, 0)
      this.body.position.set(
        this.bubblePaddingX,
        this.bubblePaddingY + this.nameLabel.height + this.nameGap
      )
      this.avatar.position.set(0, 0)
      this.avatarFrame.position.set(0, 0)
      this.bubbleLayer.pivot.set(0, 0)
      this.bubbleLayer.position.set(0, 0)
      this.typingLabel.anchor.set(1, 0)
      this.typingLabel.position.set(
        this.avatar.x - this.typingOffset,
        avatarSize - this.typingLabel.height
      )
    }

    this.typingLabel.visible = false
    this.bubbleLayer.addChild(this.bubbleFrame, this.nameLabel, this.body)
    this.addChild(this.bubbleLayer, this.typingLabel, this.avatar, this.avatarFrame)
    this.layoutBubbleGeometry()
  }

  buildTypingTimeline(wordDuration = 0.14, onStep?: () => void) {
    const steps = splitByWord(this.fullText)
    const timeline = gsap.timeline()
    let current = ''

    this.body.setText('')
    this.body.compose(this.emojiFactory)
    this.body.pivot.set(0, 0)
    this.layoutBubbleGeometry()
    if (onStep) {
      onStep()
    }

    steps.forEach((step) => {
      timeline.call(() => {
        current += step
        this.body.setText(current)
        this.body.compose(this.emojiFactory)
        this.body.pivot.set(0, 0)
        this.layoutBubbleGeometry()
        if (onStep) {
          onStep()
        }
      })
      timeline.to({}, { duration: wordDuration })
    })

    return timeline
  }

  playBubbleScaleUp() {
    this.bubbleLayer.scale.set(0.88, 0.88)
    this.bubbleLayer.alpha = 0.65
    const tl = gsap.timeline()
    tl.to(this.bubbleLayer, {
      alpha: 1,
      duration: 0.2,
      ease: 'power1.out',
    })
    tl.to(
      this.bubbleLayer.scale,
      {
        x: 1,
        y: 1,
        duration: 0.24,
        ease: 'back.out(1.6)',
      },
      0
    )
    return tl
  }

  showTypingState() {
    this.typingLabel.text = `${this.displayName} is typing...`
    this.layoutTypingLabel()
    this.typingLabel.visible = true
    this.bubbleLayer.visible = false
    this.bubbleLayer.renderable = false
    this.currentRowHeight = this.avatarSize
  }

  showMessageState() {
    this.typingLabel.visible = false
    this.nameLabel.text = this.displayName
    this.bubbleLayer.visible = true
    this.bubbleLayer.renderable = true
    this.layoutBubbleGeometry()
  }

  private layoutTypingLabel() {
    if (this.side === 'left') {
      this.typingLabel.position.set(
        this.bubbleLeft + this.bubblePaddingX,
        this.avatarSize - this.typingLabel.height
      )
      return
    }
    this.typingLabel.position.set(
      this.avatar.x - this.typingOffset,
      this.avatarSize - this.typingLabel.height
    )
  }

  private layoutBubbleGeometry() {
    const bounds = this.body.getLocalBounds()
    const bubbleWidth = bounds.width + this.bubblePaddingX * 2
    const bubbleHeight =
      bounds.height + this.bubblePaddingY * 2 + this.nameLabel.height + this.nameGap

    this.currentRowHeight = Utils.clamp(bubbleHeight, this.avatarSize, Number.POSITIVE_INFINITY)
    this.currentRowWidth = this.bubbleLeft + bubbleWidth

    this.bubbleFrame.clear()
    this.bubbleFrame.lineStyle(2, 0x1f1f1f, 0.85)
    this.bubbleFrame.beginFill(0xffffff, 0.92)
    this.bubbleFrame.drawRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16)
    this.bubbleFrame.endFill()

    if (this.side === 'left') {
      this.bubbleFrame.position.set(this.bubbleLeft, 0)
      this.nameLabel.anchor.set(0, 0)
      this.nameLabel.position.set(this.bubbleLeft + this.bubblePaddingX, this.bubblePaddingY)
      this.body.position.set(
        this.bubbleLeft + this.bubblePaddingX,
        this.bubblePaddingY + this.nameLabel.height + this.nameGap
      )
      this.avatar.position.set(0, 0)
      this.avatarFrame.position.set(0, 0)
      this.bubbleLayer.pivot.set(this.bubbleLeft, 0)
      this.bubbleLayer.position.set(this.bubbleLeft, 0)
    } else {
      this.bubbleFrame.position.set(0, 0)
      this.nameLabel.anchor.set(1, 0)
      this.nameLabel.position.set(bubbleWidth - this.bubblePaddingX, this.bubblePaddingY)
      this.body.position.set(
        this.bubblePaddingX,
        this.bubblePaddingY + this.nameLabel.height + this.nameGap
      )
      this.avatar.position.set(bubbleWidth + 16, 0)
      this.avatarFrame.position.set(bubbleWidth + 16, 0)
      this.bubbleLayer.pivot.set(bubbleWidth, 0)
      this.bubbleLayer.position.set(bubbleWidth, 0)
    }

    this.layoutTypingLabel()
  }
}

function splitByWord(text: string) {
  const parts = text.match(/\S+\s*/g)
  return parts && parts.length > 0 ? parts : [text]
}
