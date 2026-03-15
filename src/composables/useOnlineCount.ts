import { ref, readonly, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useOnlineCount() {
  const onlineCount = ref(1)
  let channel: RealtimeChannel | null = null

  onMounted(() => {
    channel = supabase
      .channel('online-presence', {
        config: { presence: { key: crypto.randomUUID() } },
      })
      .on('presence', { event: 'sync' }, () => {
        if (!channel) return
        const state = channel.presenceState()
        onlineCount.value = Object.keys(state).length
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && channel) {
          await channel.track({ online: true }).catch(console.error)
        }
      })
  })

  onUnmounted(() => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  })

  return { onlineCount: readonly(onlineCount) }
}
