import { Container, Sprite, Text, TextMetrics, TextStyle } from 'pixi.js'
import Utils from '../core/utils'

type Token =
  | { type: 'text'; value: string }
  | { type: 'emoji'; value: string }
type Piece =
  | { type: 'text'; value: string }
  | { type: 'emoji'; value: string }

export class RichTextLine extends Container {
  private tokens: Token[]
  private style: TextStyle
  private emojiSize: number
  private emojiFactory: (name: string) => Sprite | null = () => null

  constructor(text: string, style: TextStyle) {
    super()
    this.style = style
    this.emojiSize = (style.lineHeight || style.fontSize || 24) as number
    this.tokens = parseTokens(text)
  }

  setText(text: string) {
    this.tokens = parseTokens(text)
  }

  compose(getEmojiTexture: (name: string) => Sprite | null = () => null) {
    if (typeof getEmojiTexture !== 'function') {
      getEmojiTexture = () => null
    }
    this.emojiFactory = getEmojiTexture
    this.removeChildren()

    const pieces = flattenToPieces(this.tokens)
    const lineHeight = this.emojiSize
    const maxWidth =
      this.style.wordWrap && typeof this.style.wordWrapWidth === 'number'
        ? this.style.wordWrapWidth
        : Number.POSITIVE_INFINITY

    let x = 0
    let y = 0
    let maxLineWidth = 0

    for (const piece of pieces) {
      if (piece.type === 'text') {
        if (piece.value.length === 0) {
          continue
        }

        if (piece.value === '\n') {
          maxLineWidth = Utils.clamp(x, maxLineWidth, Number.POSITIVE_INFINITY)
          x = 0
          y += lineHeight
          continue
        }

        if (x === 0 && /^\s+$/.test(piece.value)) {
          continue
        }

        const isSpaces = /^\s+$/.test(piece.value)
        const textValue = isSpaces ? piece.value.replace(/ /g, '\u00A0') : piece.value
        const metrics = TextMetrics.measureText(textValue, this.style)
        if (x > 0 && x + metrics.width > maxWidth && !isSpaces) {
          maxLineWidth = Utils.clamp(x, maxLineWidth, Number.POSITIVE_INFINITY)
          x = 0
          y += lineHeight
        }

        const text = new Text(textValue, this.style)
        const textY = y + (lineHeight - metrics.height) / 2
        text.position.set(x, textY)
        this.addChild(text)
        x += metrics.width
      } else {
        const sprite = this.emojiFactory(piece.value)
        const spriteWidth = lineHeight
        if (x > 0 && x + spriteWidth > maxWidth) {
          maxLineWidth = Utils.clamp(x, maxLineWidth, Number.POSITIVE_INFINITY)
          x = 0
          y += lineHeight
        }

        if (!sprite) {
          const fallbackWidth = TextMetrics.measureText(`{${piece.value}}`, this.style).width
          if (x > 0 && x + fallbackWidth > maxWidth) {
            maxLineWidth = Utils.clamp(x, maxLineWidth, Number.POSITIVE_INFINITY)
            x = 0
            y += lineHeight
          }
          const fallback = new Text(`{${piece.value}}`, this.style)
          const fallbackY = (lineHeight - fallback.height) / 2
          fallback.position.set(x, fallbackY + y)
          this.addChild(fallback)
          x += fallback.width
          continue
        }

        sprite.width = spriteWidth
        sprite.height = lineHeight
        sprite.position.set(x, y)
        this.addChild(sprite)
        x += sprite.width
      }
    }

    maxLineWidth = Utils.clamp(x, maxLineWidth, Number.POSITIVE_INFINITY)
    const totalHeight = y + lineHeight
    this.pivot.set(maxLineWidth / 2, totalHeight / 2)
  }

}

function parseTokens(text: string): Token[] {
  const tokens: Token[] = []
  const regex = /\{([a-zA-Z0-9_-]+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    if (start > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, start) })
    }
    tokens.push({ type: 'emoji', value: match[1] })
    lastIndex = start + match[0].length
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return tokens
}

function flattenToPieces(tokens: Token[]): Piece[] {
  const pieces: Piece[] = []
  for (const token of tokens) {
    if (token.type === 'emoji') {
      pieces.push(token)
      continue
    }
    const chunks = token.value.split(/(\n|\s+)/)
    for (const chunk of chunks) {
      if (chunk.length === 0) {
        continue
      }
      pieces.push({ type: 'text', value: chunk })
    }
  }
  return pieces
}
