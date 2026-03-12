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
  background: linear-gradient(145deg, #5a5048 0%, #4a4038 40%, #3a3028 100%);
  box-shadow:
    8px 12px 30px rgba(0, 0, 0, 0.4),
    4px 6px 15px rgba(0, 0, 0, 0.3),
    inset 0 2px 3px rgba(255, 255, 255, 0.15),
    inset 0 -2px 3px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.gallery-frame::before {
  content: "";
  position: absolute;
  inset: var(--bevel-outer-inset);
  border-top: 8px solid rgba(255, 255, 255, 0.12);
  border-left: 8px solid rgba(255, 255, 255, 0.08);
  border-bottom: 8px solid rgba(0, 0, 0, 0.15);
  border-right: 8px solid rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

.gallery-frame::after {
  content: "";
  position: absolute;
  inset: var(--bevel-inner-inset);
  border-top: 4px solid rgba(0, 0, 0, 0.2);
  border-left: 4px solid rgba(0, 0, 0, 0.15);
  border-bottom: 4px solid rgba(255, 255, 255, 0.1);
  border-right: 4px solid rgba(255, 255, 255, 0.08);
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
