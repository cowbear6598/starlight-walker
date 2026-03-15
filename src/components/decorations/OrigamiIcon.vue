<script setup lang="ts">
import type { OrigamiType } from '@/constants/decorations'

defineProps<{
  type: OrigamiType
}>()
</script>

<template>
  <svg v-if="type === 'crane'" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <polygon points="8,24 20,18 32,24 20,28" fill="#d45b56" stroke="#a83a35" stroke-width="1.2" stroke-linejoin="miter" />
    <polygon points="8,24 4,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="32,24 36,8 20,18" fill="#e87a75" stroke="#a83a35" stroke-width="1" stroke-linejoin="miter" />
    <line x1="8" y1="24" x2="3" y2="30" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round" />
    <line x1="32" y1="24" x2="37" y2="18" stroke="#a83a35" stroke-width="1.2" stroke-linecap="round" />
  </svg>

  <svg v-else-if="type === 'star'" width="35" height="35" viewBox="0 0 40 40" fill="none">
    <polygon points="20,3 24,15 37,15 27,22 30,35 20,27 10,35 13,22 3,15 16,15" fill="#5aad6a" stroke="#3d8a4d" stroke-width="1.2" stroke-linejoin="miter" />
  </svg>

  <svg v-else-if="type === 'plane'" width="38" height="38" viewBox="0 0 40 40" fill="none">
    <polygon points="3,20 37,10 27,20" fill="#8b6fad" stroke="#6a5090" stroke-width="1.2" stroke-linejoin="miter" />
    <polygon points="3,20 37,30 27,20" fill="#a088c4" stroke="#6a5090" stroke-width="1.2" stroke-linejoin="miter" />
    <line x1="3" y1="20" x2="27" y2="20" stroke="#6a5090" stroke-width="0.8" />
  </svg>

  <svg v-else-if="type === 'fox'" width="38" height="38" viewBox="0 0 40 40" fill="none">
    <polygon points="20,10 34,22 20,36 6,22" fill="#d4884a" stroke="#ad6530" stroke-width="1.2" stroke-linejoin="miter" />
    <polygon points="6,22 4,6 17,15" fill="#e8a870" stroke="#ad6530" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="34,22 36,6 23,15" fill="#e8a870" stroke="#ad6530" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="15,21 17,19 19,21 17,23" fill="#ad6530" />
    <polygon points="21,21 23,19 25,21 23,23" fill="#ad6530" />
    <polygon points="19,27 21,27 20,29" fill="#ad6530" />
  </svg>

  <svg v-else-if="type === 'flower'" width="38" height="38" viewBox="0 0 40 40" fill="none">
    <polygon points="20,20 14,10 20,2 26,10" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,20 28,12 36,14 30,22" fill="#b894d4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,20 30,28 28,36 22,28" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,20 18,30 10,36 12,26" fill="#b894d4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,20 10,24 4,14 14,12" fill="#a07dc4" stroke="#7c5aa0" stroke-width="1" stroke-linejoin="miter" />
    <circle cx="20" cy="20" r="3" fill="#7c5aa0" />
  </svg>

  <svg v-else-if="type === 'boat'" width="38" height="38" viewBox="0 0 40 40" fill="none">
    <polygon points="20,6 34,26 6,26" fill="#5b8ec4" stroke="#3d6ea0" stroke-width="1.2" stroke-linejoin="miter" />
    <polygon points="5,28 35,28 31,36 9,36" fill="#7aaad4" stroke="#3d6ea0" stroke-width="1.2" stroke-linejoin="miter" />
    <line x1="20" y1="6" x2="20" y2="26" stroke="#3d6ea0" stroke-width="0.8" opacity="0.5" />
  </svg>

  <svg v-else-if="type === 'butterfly'" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <polygon points="20,12 6,4 4,16 17,20" fill="#5bb5c4" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,24 6,34 4,22 17,20" fill="#7ecad6" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,12 34,4 36,16 23,20" fill="#5bb5c4" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,24 34,34 36,22 23,20" fill="#7ecad6" stroke="#3a8f9e" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,8 21,20 20,32 19,20" fill="#3a8f9e" />
  </svg>

  <svg v-else-if="type === 'windmill'" width="38" height="38" viewBox="0 0 40 40" fill="none">
    <polygon points="20,20 34,6 34,20" fill="#d4b943" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,20 34,34 20,34" fill="#e8d060" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,20 6,34 6,20" fill="#d4b943" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="20,20 6,6 20,6" fill="#e8d060" stroke="#a8920f" stroke-width="1" stroke-linejoin="miter" />
    <circle cx="20" cy="20" r="2" fill="#a8920f" />
  </svg>

  <svg v-else-if="type === 'fan'" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <polygon points="20,35 5,15 8,10 13,7 18,5 20,4 22,5 27,7 32,10 35,15" fill="#c46b7c" stroke="#9e4a5c" stroke-width="1.2" stroke-linejoin="round" />
    <rect x="18" y="35" width="4" height="4" rx="0.5" fill="#9e4a5c" />
    <line x1="20" y1="35" x2="5" y2="15" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4" />
    <line x1="20" y1="35" x2="13" y2="7" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4" />
    <line x1="20" y1="35" x2="20" y2="4" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4" />
    <line x1="20" y1="35" x2="27" y2="7" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4" />
    <line x1="20" y1="35" x2="35" y2="15" stroke="#9e4a5c" stroke-width="0.7" opacity="0.4" />
  </svg>

  <svg v-else-if="type === 'rabbit'" width="35" height="42" viewBox="0 0 35 42" fill="none">
    <polygon points="13,16 10,2 17,14" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="22,14 25,2 18,16" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="10,16 8,22 10,30 17.5,33 25,30 27,22 25,16 17.5,14" fill="#e8a8b5" stroke="#c06878" stroke-width="1" stroke-linejoin="miter" />
    <polygon points="13,32 22,32 25,39 10,39" fill="#e091a0" stroke="#c06878" stroke-width="1" stroke-linejoin="miter" />
  </svg>
</template>
