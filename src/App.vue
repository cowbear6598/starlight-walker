<script setup lang="ts">
import GalleryFrame from '@/components/scene/GalleryFrame.vue'
import MainScene from '@/components/scene/MainScene.vue'
import OrigamiIcon from '@/components/decorations/OrigamiIcon.vue'
import CornerCloud from '@/components/decorations/CornerCloud.vue'
import { ORIGAMI_ITEMS, CORNER_POSITIONS } from '@/constants/decorations'
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <CornerCloud v-for="corner in CORNER_POSITIONS" :key="corner" :corner="corner" />

    <div
      v-for="(item, index) in ORIGAMI_ITEMS"
      :key="`origami-${index}`"
      class="origami"
      :style="item.style"
    >
      <OrigamiIcon :type="item.type" />
    </div>

    <GalleryFrame>
      <MainScene />
    </GalleryFrame>
  </div>
</template>

<style scoped>
.origami {
  position: fixed;
  pointer-events: none;
  z-index: 0;
}

@media (max-width: 1024px) {
  .origami {
    display: none;
  }
}
</style>
