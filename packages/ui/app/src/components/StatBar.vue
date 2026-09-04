<script setup lang="ts">
import type { BoardStats } from '@/kinotic/types'

defineProps<{ stats: BoardStats }>()
</script>

<template>
    <div class="statbar">
        <div class="stat accent-azure"><span class="dot"></span><b>{{ stats.backlog }}</b> backlog</div>
        <div class="stat accent-aqua"><span class="dot"></span><b>{{ stats.active }}</b> in flight</div>
        <div class="stat accent-lime"><span class="dot"></span><b>{{ stats.done }}</b> done</div>
        <div class="stat accent-rose" :class="{ dim: stats.overdue === 0 }"><span class="dot"></span><b>{{ stats.overdue }}</b> overdue</div>
    </div>
</template>

<style scoped>
.statbar { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.stat {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    font-size: 0.8rem;
    color: var(--text-1);
}
.stat b { color: var(--text-0); font-variant-numeric: tabular-nums; }
.stat.dim { opacity: 0.4; }
</style>
