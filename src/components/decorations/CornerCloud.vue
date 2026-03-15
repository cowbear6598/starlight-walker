<script setup lang="ts">
import type { CornerPosition } from '@/constants/decorations'

defineProps<{
  corner: CornerPosition
}>()
</script>

<template>
  <div :class="['corner-cloud', `corner-cloud--${corner}`]">
    <svg :class="`corner-cloud__svg--${corner}`" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 70 Q10 40 40 40 Q40 20 60 20 Q60 10 70 10" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <path d="M5 60 Q5 30 35 30 Q35 15 55 15" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <path d="M15 75 Q15 50 45 50 Q45 35 65 35 Q65 25 75 25" stroke="#c4a97d" stroke-width="1.5" fill="none" stroke-linecap="round" />
    </svg>
  </div>
</template>

<style scoped>
.corner-cloud {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  opacity: 0.3;
}

.corner-cloud--tl {
  top: 12px;
  left: 12px;
}

.corner-cloud--tr {
  top: 12px;
  right: 12px;
}

.corner-cloud--bl {
  bottom: 12px;
  left: 12px;
}

.corner-cloud--br {
  bottom: 12px;
  right: 12px;
}

.corner-cloud__svg--tr {
  transform: scaleX(-1);
}

.corner-cloud__svg--bl {
  transform: scaleY(-1);
}

.corner-cloud__svg--br {
  transform: scale(-1, -1);
}

@media (max-width: 1024px) {
  .corner-cloud {
    display: none;
  }
}
</style>
