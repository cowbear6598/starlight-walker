import * as THREE from 'three'
import type { NpcManager } from '@/scene/npc/npcManager'
import { getThreadsUrl } from '@/scene/npc/npcConfig'

export function useNpcInteraction(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  npcManager: NpcManager,
): { dispose: () => void } {
  const raycaster = new THREE.Raycaster()
  const domElement = renderer.domElement
  const _mouse = new THREE.Vector2()

  function updateMousePosition(event: PointerEvent): void {
    const rect = domElement.getBoundingClientRect()
    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  function onPointerMove(event: PointerEvent): void {
    updateMousePosition(event)
    raycaster.setFromCamera(_mouse, camera)
    const intersects = raycaster.intersectObjects(npcManager.getInteractableObjects(), true)
    domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
  }

  function onClick(event: PointerEvent): void {
    updateMousePosition(event)
    raycaster.setFromCamera(_mouse, camera)
    const intersects = raycaster.intersectObjects(npcManager.getInteractableObjects(), true)

    if (intersects.length === 0) return

    const hit = intersects[0]!.object
    const npcData = npcManager.getNpcDataByObject(hit)
    if (!npcData) return

    const npcRefs = npcManager.getNpcRefsByData(npcData)
    if (npcRefs) {
      npcManager.playClickFeedback(npcRefs)
    }
    window.open(getThreadsUrl(npcData.threadsUsername), '_blank', 'noopener,noreferrer')
  }

  domElement.addEventListener('pointermove', onPointerMove)
  domElement.addEventListener('click', onClick)

  return {
    dispose: () => {
      domElement.removeEventListener('pointermove', onPointerMove)
      domElement.removeEventListener('click', onClick)
    },
  }
}
