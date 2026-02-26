import Utils from './utils'

let loadingCount = 0
let indicatorEl: HTMLDivElement | null = null

export function initLoadingIndicator(el: HTMLDivElement) {
  indicatorEl = el
  sync()
}

export function beginLoading() {
  loadingCount += 1
  sync()
}

export function endLoading() {
  loadingCount = Utils.clamp(loadingCount - 1, 0, Number.POSITIVE_INFINITY)
  sync()
}

function sync() {
  if (!indicatorEl) {
    return
  }
  indicatorEl.classList.toggle('loading--visible', loadingCount > 0)
}
