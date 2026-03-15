import { onUnmounted } from 'vue'

const FULL_TITLE = 'Starlight Walker'
const AWAY_TITLE = '回來繼續散步...'
const TYPING_INTERVAL_MS = 150

export function useTabTitle(): void {
  let typingTimer: ReturnType<typeof setTimeout> | null = null

  function clearTypingTimer(): void {
    if (typingTimer === null) return
    clearTimeout(typingTimer)
    typingTimer = null
  }

  function typeTitle(index: number = 0): void {
    clearTypingTimer()

    if (index > FULL_TITLE.length) return

    document.title = FULL_TITLE.slice(0, index)

    typingTimer = setTimeout(() => typeTitle(index + 1), TYPING_INTERVAL_MS)
  }

  function onVisibilityChange(): void {
    if (document.hidden) {
      clearTypingTimer()
      document.title = AWAY_TITLE
      return
    }

    typeTitle()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  typeTitle()

  onUnmounted(() => {
    clearTypingTimer()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
}
