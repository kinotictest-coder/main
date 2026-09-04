<script setup lang="ts">
import type { Task, Tag } from '@main/domain'
import type { TaskStatus } from '@/kinotic/types'
import TaskCard from './TaskCard.vue'

defineProps<{
    status: TaskStatus
    label: string
    tasks: Task[]
    tags: Map<string, Tag>
}>()

const emit = defineEmits<{
    (e: 'edit', task: Task): void
    (e: 'move', id: string, status: TaskStatus): void
    (e: 'delete', id: string): void
}>()
</script>

<template>
    <section class="column">
        <header>
            <span class="dot" :class="`accent-${status === 'BACKLOG' ? 'violet' : status === 'ACTIVE' ? 'aqua' : 'lime'}`"></span>
            <h3>{{ label }}</h3>
            <span class="count muted">{{ tasks.length }}</span>
        </header>
        <div class="stack">
            <TaskCard
                v-for="task in tasks"
                :key="task.id!"
                :task="task"
                :tags="tags"
                @edit="emit('edit', $event)"
                @move="(id, s) => emit('move', id, s)"
                @delete="emit('delete', $event)"
            />
            <p v-if="tasks.length === 0" class="empty muted">Nothing here</p>
        </div>
    </section>
</template>

<style scoped>
.column {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 0.75rem;
}
header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.25rem;
}
h3 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.08em; }
.count {
    margin-left: auto;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
}
.stack {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    overflow-y: auto;
    padding-right: 0.25rem;
    flex: 1;
}
.empty {
    text-align: center;
    font-size: 0.8rem;
    padding: 1.5rem 0;
    border: 1px dashed var(--line);
    border-radius: var(--radius);
}
</style>
