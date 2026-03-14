import avatarCabLate from '@/assets/avatars/cab_late.jpg'
import avatarDarrelTw from '@/assets/avatars/darrel_tw_.jpg'
import avatarFrankchen from '@/assets/avatars/frankchen-tw.jpg'
import avatarSupergalen from '@/assets/avatars/supergalen0921.jpg'
import avatarYayapipifly from '@/assets/avatars/yayapipifly.jpg'

export const NPC_THETA = 0.08

export interface NpcData {
  id: string
  displayName: string
  threadsUsername: string
  avatarModule: string
  hatColor: string
  scarfColor: string
}

export const NPC_LIST: NpcData[] = [
  {
    id: 'cab_late',
    displayName: '@cab_late',
    threadsUsername: 'cab_late',
    avatarModule: avatarCabLate,
    hatColor: '#cc3333',
    scarfColor: '#ff6666',
  },
  {
    id: 'darrel_tw_',
    displayName: '@darrel_tw_',
    threadsUsername: 'darrel_tw_',
    avatarModule: avatarDarrelTw,
    hatColor: '#3366cc',
    scarfColor: '#6699ff',
  },
  {
    id: 'frankchen_tw',
    displayName: '@frankchen.tw',
    threadsUsername: 'frankchen.tw',
    avatarModule: avatarFrankchen,
    hatColor: '#9944cc',
    scarfColor: '#bb77ee',
  },
  {
    id: 'supergalen0921',
    displayName: '@supergalen0921',
    threadsUsername: 'supergalen0921',
    avatarModule: avatarSupergalen,
    hatColor: '#ccaa33',
    scarfColor: '#ffdd66',
  },
  {
    id: 'yayapipifly',
    displayName: '@yayapipifly',
    threadsUsername: 'yayapipifly',
    avatarModule: avatarYayapipifly,
    hatColor: '#cc6633',
    scarfColor: '#ff9966',
  },
]

const VALID_USERNAME_RE = /^[\w.]+$/

export function getThreadsUrl(threadsUsername: string): string {
  if (!VALID_USERNAME_RE.test(threadsUsername)) {
    throw new Error(`Invalid Threads username: ${threadsUsername}`)
  }
  return `https://www.threads.net/@${encodeURIComponent(threadsUsername)}`
}
