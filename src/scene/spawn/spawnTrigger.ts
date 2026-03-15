export interface SpawnEntry {
  type: string
  spawn: () => boolean
}

export class SpawnTrigger {
  private entries: SpawnEntry[] = []
  private elapsed: number = 0
  private nextTriggerAt: number

  constructor(
    private minInterval: number,
    private maxInterval: number,
    firstDelayMin?: number,
    firstDelayMax?: number,
  ) {
    if (firstDelayMin !== undefined && firstDelayMax !== undefined) {
      this.nextTriggerAt = firstDelayMin + Math.random() * (firstDelayMax - firstDelayMin)
    } else {
      this.nextTriggerAt = this.randomInterval()
    }
  }

  register(entry: SpawnEntry): void {
    this.entries.push(entry)
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime
    if (this.elapsed < this.nextTriggerAt) return

    for (const entry of this.entries) {
      if (entry.spawn()) break
    }

    this.elapsed = 0
    this.nextTriggerAt = this.randomInterval()
  }

  private randomInterval(): number {
    return this.minInterval + Math.random() * (this.maxInterval - this.minInterval)
  }
}
