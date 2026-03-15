<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { SCENE_ASPECT } from '@/constants/scene'

const FRAME_HORIZONTAL_PADDING = 32
const FRAME_VERTICAL_PADDING = 24

const frameWidth = ref(0)
const frameHeight = ref(0)
const ready = ref(false)

function calculateSize() {
  const availableWidth = window.innerWidth - FRAME_HORIZONTAL_PADDING
  const availableHeight = window.innerHeight - FRAME_VERTICAL_PADDING

  const candidateWidth = availableHeight * SCENE_ASPECT

  if (candidateWidth <= availableWidth) {
    frameWidth.value = candidateWidth
    frameHeight.value = availableHeight
  }
  else {
    frameWidth.value = availableWidth
    frameHeight.value = availableWidth / SCENE_ASPECT
  }
}

onMounted(async () => {
  calculateSize()
  await nextTick()
  ready.value = true
  window.addEventListener('resize', calculateSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateSize)
})
</script>

<template>
  <div
    class="gallery-frame"
    :style="{ width: `${frameWidth}px`, height: `${frameHeight}px` }"
  >
    <div class="gallery-inner">
      <slot v-if="ready" />
    </div>
  </div>
</template>

<style scoped>
.gallery-frame {
  --frame-padding: 20px;
  --bevel-outer-inset: 6px;
  --bevel-inner-inset: 14px;

  position: relative;
  padding: var(--frame-padding);
  background:
    repeating-linear-gradient(
      60deg,
      rgba(100, 85, 60, 0.1) 0px,
      transparent 1px,
      transparent 14px,
      rgba(100, 85, 60, 0.1) 15px
    ),
    repeating-linear-gradient(
      -60deg,
      rgba(100, 85, 60, 0.1) 0px,
      transparent 1px,
      transparent 14px,
      rgba(100, 85, 60, 0.1) 15px
    ),
    repeating-linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.06) 0px,
      transparent 1px,
      transparent 2px,
      rgba(0, 0, 0, 0.06) 3px
    ),
    linear-gradient(180deg, #7a6550 0%, #6b5842 50%, #5c4b38 100%);
  box-shadow:
    6px 8px 20px rgba(0, 0, 0, 0.2),
    2px 4px 10px rgba(0, 0, 0, 0.15),
    inset 0 2px 3px rgba(200, 180, 140, 0.15),
    inset 0 -2px 3px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(80, 65, 45, 0.4);
  outline: 2px solid rgba(80, 65, 45, 0.25);
  outline-offset: -4px;
  z-index: 1;
}

.gallery-frame::before {
  content: "";
  position: absolute;
  inset: var(--bevel-outer-inset);
  border-top: 6px solid rgba(200, 180, 140, 0.12);
  border-left: 6px solid rgba(200, 180, 140, 0.08);
  border-bottom: 6px solid rgba(40, 30, 15, 0.15);
  border-right: 6px solid rgba(40, 30, 15, 0.12);
  pointer-events: none;
}

.gallery-frame::after {
  content: "";
  position: absolute;
  inset: var(--bevel-inner-inset);
  border-top: 3px solid rgba(40, 30, 15, 0.15);
  border-left: 3px solid rgba(40, 30, 15, 0.12);
  border-bottom: 3px solid rgba(200, 180, 140, 0.08);
  border-right: 3px solid rgba(200, 180, 140, 0.06);
  pointer-events: none;
}

.gallery-inner {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.4);
}
</style>
