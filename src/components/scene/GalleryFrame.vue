<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const ASPECT = 9 / 20

const frameWidth = ref(0)
const frameHeight = ref(0)
const ready = ref(false)

function calculateSize() {
  const availableWidth = window.innerWidth - 32
  const availableHeight = window.innerHeight - 24

  const candidateWidth = availableHeight * ASPECT

  if (candidateWidth <= availableWidth) {
    frameWidth.value = candidateWidth
    frameHeight.value = availableHeight
  }
  else {
    frameWidth.value = availableWidth
    frameHeight.value = availableWidth / ASPECT
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
  <div>
    <div
      class="gallery-frame"
      :style="{ width: `${frameWidth}px`, height: `${frameHeight}px` }"
    >
      <div class="gallery-inner">
        <slot v-if="ready" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-frame {
  position: relative;
  padding: 20px;
  /* 深色木質/金屬框色 */
  background: linear-gradient(145deg, #5a5048 0%, #4a4038 40%, #3a3028 100%);
  /* 立體外框陰影：向外投射 + 框體本身的厚度感 */
  box-shadow:
    /* 外投影 - 畫框掛在牆上的影子 */
    8px 12px 30px rgba(0, 0, 0, 0.4),
    4px 6px 15px rgba(0, 0, 0, 0.3),
    /* 外框頂部受光高光 */
    inset 0 2px 3px rgba(255, 255, 255, 0.15),
    /* 外框底部暗面 */
    inset 0 -2px 3px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.gallery-frame::before {
  content: "";
  position: absolute;
  inset: 6px;
  /* 用 border 做斜面效果：上左亮、下右暗 */
  border-top: 8px solid rgba(255, 255, 255, 0.12);
  border-left: 8px solid rgba(255, 255, 255, 0.08);
  border-bottom: 8px solid rgba(0, 0, 0, 0.15);
  border-right: 8px solid rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

.gallery-frame::after {
  content: "";
  position: absolute;
  inset: 14px;
  /* 內斜面：方向相反，上左暗、下右亮 */
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
  /* 畫面嵌入框內的凹陷感 */
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.4);
}
</style>
