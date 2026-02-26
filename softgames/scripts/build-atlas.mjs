import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { packAsync } from 'free-tex-packer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const inputDir = path.join(root, 'src', 'assets', 'images')
const outputDir = path.join(root, 'src', 'assets', 'atlases')
const outputName = 'main-atlas'
const maxDepth = 2

if (!fs.existsSync(inputDir)) {
  console.error('Input folder not found:', inputDir)
  process.exit(1)
}

const files = collectImageFiles(inputDir, maxDepth)

if (files.length === 0) {
  console.log('No images found in', inputDir)
  process.exit(0)
}

const usedNames = new Set()
const buffers = []
for (const absolutePath of files) {
  const fileName = path.basename(absolutePath)
  const fileKey = fileName.replace(/\.[^/.]+$/, '')
  if (usedNames.has(fileKey)) {
    console.warn(`Skipping duplicate atlas key: ${fileKey}`)
    continue
  }
  usedNames.add(fileKey)
  buffers.push({
    path: fileKey,
    contents: fs.readFileSync(absolutePath),
  })
}

const options = {
  textureName: outputName,
  width: 3072,
  height: 3072,
  fixedSize: false,
  allowRotation: false,
  padding: 4,
  extrude: 4,
  allowTrim: false,
  exporter: 'Pixi',
}

const result = await packAsync(buffers, options)
const packedFiles = Array.isArray(result) ? result : result.files
if (!packedFiles) {
  console.error('Atlas build failed: no output from packer')
  process.exit(1)
}
fs.mkdirSync(outputDir, { recursive: true })
cleanupOldAtlasFiles(outputDir, outputName)

for (const file of packedFiles) {
  fs.writeFileSync(path.join(outputDir, file.name), file.buffer)
}

console.log(`Atlas generated: ${path.join(outputDir, `${outputName}.json`)}`)

function collectImageFiles(baseDir, depth, level = 0) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name)
    if (entry.isDirectory()) {
      if (level < depth) {
        files.push(...collectImageFiles(fullPath, depth, level + 1))
      }
      continue
    }
    if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

function cleanupOldAtlasFiles(dir, baseName) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const pattern = new RegExp(`^${baseName}(?:-\\d+)?\\.(json|png|jpg|jpeg|webp)$`, 'i')
  for (const entry of entries) {
    if (!entry.isFile() || !pattern.test(entry.name)) {
      continue
    }
    fs.unlinkSync(path.join(dir, entry.name))
  }
}
