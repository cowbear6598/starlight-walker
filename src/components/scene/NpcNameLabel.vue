<script setup lang="ts">
import type { NpcVisibilityState } from '@/scene/npc/npcManager'

defineProps<{
  labels: NpcVisibilityState[]
}>()
</script>

<template>
  <div class="npc-label-container">
    <template v-for="label in labels" :key="label.username">
      <div
        v-if="label.showName"
        class="npc-label"
        :style="{
          left: `${label.screenX}%`,
          top: `${label.screenY}%`,
          transform: `translate(-50%, -100%) rotate(${label.rotation}deg)`,
        }"
      >
        @{{ label.username }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.npc-label-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.npc-label {
  position: absolute;
  font-size: 11px;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.35);
  border-radius: 4px;
  padding: 2px 8px;
  transition: opacity 0.3s ease;
  white-space: nowrap;
}
</style>
