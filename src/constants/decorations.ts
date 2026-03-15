export type OrigamiType =
  | 'crane'
  | 'star'
  | 'plane'
  | 'fox'
  | 'flower'
  | 'boat'
  | 'butterfly'
  | 'windmill'
  | 'fan'
  | 'rabbit'

export interface OrigamiConfig {
  type: OrigamiType
  style: {
    top?: string
    bottom?: string
    left?: string
    right?: string
    opacity: number
    transform: string
  }
}

export const ORIGAMI_ITEMS: OrigamiConfig[] = [
  // 左側牆面
  { type: 'crane', style: { top: '8%', left: '5%', opacity: 0.6, transform: 'rotate(-20deg)' } },
  { type: 'star', style: { top: '18%', left: '18%', opacity: 0.55, transform: 'rotate(15deg)' } },
  { type: 'plane', style: { top: '30%', left: '8%', opacity: 0.6, transform: 'rotate(30deg)' } },
  { type: 'fox', style: { top: '42%', left: '20%', opacity: 0.55, transform: 'rotate(-10deg)' } },
  { type: 'flower', style: { top: '55%', left: '6%', opacity: 0.6, transform: 'rotate(25deg)' } },
  { type: 'boat', style: { top: '65%', left: '22%', opacity: 0.55, transform: 'rotate(-15deg)' } },
  { type: 'butterfly', style: { top: '78%', left: '10%', opacity: 0.6, transform: 'rotate(5deg)' } },
  { type: 'windmill', style: { top: '88%', left: '20%', opacity: 0.5, transform: 'rotate(20deg)' } },
  { type: 'rabbit', style: { top: '48%', left: '3%', opacity: 0.55, transform: 'rotate(-8deg)' } },
  // 右側牆面
  { type: 'butterfly', style: { top: '10%', right: '12%', opacity: 0.6, transform: 'rotate(10deg)' } },
  { type: 'crane', style: { top: '22%', right: '4%', opacity: 0.55, transform: 'rotate(-25deg)' } },
  { type: 'fan', style: { top: '35%', right: '18%', opacity: 0.6, transform: 'rotate(8deg)' } },
  { type: 'star', style: { top: '48%', right: '8%', opacity: 0.55, transform: 'rotate(-30deg)' } },
  { type: 'flower', style: { top: '58%', right: '22%', opacity: 0.5, transform: 'rotate(15deg)' } },
  { type: 'boat', style: { top: '70%', right: '5%', opacity: 0.6, transform: 'rotate(-12deg)' } },
  { type: 'windmill', style: { top: '80%', right: '15%', opacity: 0.55, transform: 'rotate(-20deg)' } },
  { type: 'plane', style: { top: '90%', right: '6%', opacity: 0.5, transform: 'rotate(35deg)' } },
  { type: 'fox', style: { top: '42%', right: '3%', opacity: 0.55, transform: 'rotate(12deg)' } },
  // 上方牆面
  { type: 'crane', style: { top: '2%', left: '32%', opacity: 0.55, transform: 'rotate(10deg)' } },
  { type: 'star', style: { top: '1%', left: '45%', opacity: 0.5, transform: 'rotate(-15deg)' } },
  { type: 'fan', style: { top: '3%', right: '35%', opacity: 0.55, transform: 'rotate(20deg)' } },
  { type: 'rabbit', style: { top: '1%', left: '55%', opacity: 0.5, transform: 'rotate(-5deg)' } },
  { type: 'plane', style: { top: '2%', right: '42%', opacity: 0.5, transform: 'rotate(40deg)' } },
  // 下方牆面
  { type: 'butterfly', style: { bottom: '2%', left: '35%', opacity: 0.55, transform: 'rotate(-10deg)' } },
  { type: 'flower', style: { bottom: '1%', left: '48%', opacity: 0.5, transform: 'rotate(18deg)' } },
  { type: 'boat', style: { bottom: '3%', right: '38%', opacity: 0.55, transform: 'rotate(-8deg)' } },
  { type: 'windmill', style: { bottom: '1%', right: '48%', opacity: 0.5, transform: 'rotate(25deg)' } },
  { type: 'star', style: { bottom: '2%', left: '42%', opacity: 0.5, transform: 'rotate(10deg)' } },
  // 相框緊鄰左右補位
  { type: 'fan', style: { top: '50%', left: '30%', opacity: 0.6, transform: 'translateY(-50%) rotate(12deg)' } },
  { type: 'crane', style: { top: '50%', right: '30%', opacity: 0.55, transform: 'translateY(-50%) rotate(-18deg)' } },
]

export type CornerPosition = 'tl' | 'tr' | 'bl' | 'br'

export const CORNER_POSITIONS: CornerPosition[] = ['tl', 'tr', 'bl', 'br']
