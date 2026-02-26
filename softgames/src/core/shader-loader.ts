export type LoadedShaderPair = {
  vertex: string
  fragment: string
}

const vertexFiles = import.meta.glob('../assets/shaders/*.vert', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const fragmentFiles = import.meta.glob('../assets/shaders/*.frag', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const shaderPairs = new Map<string, LoadedShaderPair>()
let loaded = false

export async function loadShaderPairs() {
  if (loaded) {
    return
  }

  const names = new Set<string>()
  Object.keys(vertexFiles).forEach((path) => names.add(extractName(path)))
  Object.keys(fragmentFiles).forEach((path) => names.add(extractName(path)))

  const buildTasks = Array.from(names).map(async (name) => {
    const vertexLoader = vertexFiles[`../assets/shaders/${name}.vert`]
    const fragmentLoader = fragmentFiles[`../assets/shaders/${name}.frag`]

    if (!vertexLoader || !fragmentLoader) {
      return
    }

    const [vertex, fragment] = await Promise.all([vertexLoader(), fragmentLoader()])
    shaderPairs.set(name, {
      vertex,
      fragment,
    })
  })

  await Promise.all(buildTasks)
  loaded = true
}

export function getShaderPair(name: string) {
  const shaderPair = shaderPairs.get(name)
  if (!shaderPair) {
    throw new Error(`Shader pair \"${name}\" is not loaded. Call loadShaderPairs() at startup.`)
  }
  return shaderPair
}

function extractName(path: string) {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.[^/.]+$/, '')
}
