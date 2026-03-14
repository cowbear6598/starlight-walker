import { CAT_A_OFFSET, CAT_B_OFFSET } from '@/constants/scene'

export interface CatVariant {
  id: 'bell' | 'bow'
  stripeOffsets: { x: number; y: number; z: number }[]
  stripeColor: string
  headMarkings: { x: number; y: number; z: number; scaleX: number; scaleZ: number }[]
  accessoryColor: string
  offset: { x: number; y: number; z: number }
  walkPhaseOffset: number
  bodyPattern: 'star' | 'heart'
}

export const CAT_VARIANTS: CatVariant[] = [
  {
    id: 'bell',
    stripeOffsets: [
      { x: 0.06, y: 0, z: 0 },
      { x: 0.01, y: 0, z: 0 },
      { x: -0.04, y: 0, z: 0 },
      { x: -0.09, y: 0, z: 0 },
    ],
    stripeColor: '#707070',
    headMarkings: [
      { x: 0.01, y: 0.02, z: 0, scaleX: 0.8, scaleZ: 1.0 },
      { x: 0.02, y: -0.01, z: -0.025, scaleX: 0.5, scaleZ: 0.4 },
    ],
    accessoryColor: '#d4a017',
    offset: CAT_A_OFFSET,
    walkPhaseOffset: 0,
    bodyPattern: 'star',
  },
  {
    id: 'bow',
    stripeOffsets: [
      { x: 0.07, y: 0, z: 0 },
      { x: 0.02, y: 0, z: 0 },
      { x: -0.03, y: 0, z: 0 },
      { x: -0.08, y: 0, z: 0 },
    ],
    stripeColor: '#707070',
    headMarkings: [
      { x: 0.01, y: 0.015, z: 0.02, scaleX: 0.6, scaleZ: 0.5 },
      { x: 0.03, y: 0.005, z: 0, scaleX: 0.4, scaleZ: 0.6 },
    ],
    accessoryColor: '#e8829a',
    offset: CAT_B_OFFSET,
    walkPhaseOffset: Math.PI * 0.6,
    bodyPattern: 'heart',
  },
]
