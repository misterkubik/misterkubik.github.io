import { Assets, Texture } from 'pixi.js'
import { loadShaderPairs } from './shader-loader'

const fontFiles = import.meta.glob('../assets/fonts/*.{ttf,otf,woff,woff2}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const atlasJsonFiles = import.meta.glob('../assets/atlases/*.json', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const atlasImageFiles = import.meta.glob('../assets/atlases/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export async function loadAssets() {
  await Promise.all([
    loadFonts(fontFiles),
    loadAtlases(atlasJsonFiles, atlasImageFiles),
    loadShaderPairs(),
  ])
}

async function loadFonts(files: Record<string, string>) {
  const loads = Object.values(files)
    .filter((url) => extractName(url) !== 'FixelDisplay-Black')
    .map(async (url) => {
    const descriptor = getFontDescriptor(url)
    const face = new FontFace(descriptor.family, `url(${url})`, descriptor.options)
    await face.load()
    document.fonts.add(face)
    })
  await Promise.all(loads)
}

async function loadAtlases(
  atlasJsonByPath: Record<string, string>,
  atlasImageByPath: Record<string, string>
) {
  const atlasImagesByName = new Map<string, string>()
  for (const [path, url] of Object.entries(atlasImageByPath)) {
    atlasImagesByName.set(extractName(path), url)
  }

  const atlasEntries = Object.entries(atlasJsonByPath)
  for (const [path, jsonUrl] of atlasEntries) {
    const alias = extractName(path)
    const imageUrl = atlasImagesByName.get(alias)
    const texture = imageUrl ? await Assets.load(imageUrl) : undefined

    Assets.add({
      alias,
      src: jsonUrl,
      data: texture ? { texture } : undefined,
    })

    const atlas = await Assets.load(alias)
    if (!isSpritesheetLike(atlas)) {
      continue
    }

    for (const [frameName, frameTexture] of Object.entries(atlas.textures)) {
      const keyWithExt = frameName.split('/').pop() ?? frameName
      const keyWithoutExt = extractName(frameName)
      Texture.addToCache(frameTexture, keyWithExt)
      Texture.addToCache(frameTexture, keyWithoutExt)
      ;(Assets as unknown as { cache?: { set: (key: string, value: unknown) => void } }).cache?.set(
        keyWithExt,
        frameTexture
      )
      ;(Assets as unknown as { cache?: { set: (key: string, value: unknown) => void } }).cache?.set(
        keyWithoutExt,
        frameTexture
      )
    }
  }
}

function extractName(path: string) {
  const clean = path.split('?')[0]
  const file = clean.split('/').pop() ?? clean
  return file.replace(/\.[^/.]+$/, '')
}

function isSpritesheetLike(
  value: unknown
): value is { textures: Record<string, Texture> } {
  return (
    !!value &&
    typeof value === 'object' &&
    'textures' in value &&
    typeof (value as { textures?: unknown }).textures === 'object'
  )
}

function getFontDescriptor(url: string) {
  const fileName = extractName(url)
  if (fileName.startsWith('FixelDisplay-')) {
    const variant = fileName.slice('FixelDisplay-'.length).toLowerCase()
    const weight = variant === 'bold' ? '700' : '500'
    return {
      family: 'Fixel',
      options: { style: 'normal', weight } satisfies FontFaceDescriptors,
    }
  }

  return {
    family: fileName,
    options: {} satisfies FontFaceDescriptors,
  }
}
