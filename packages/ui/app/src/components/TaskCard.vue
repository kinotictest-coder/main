<script setup lang="ts">
import { computed } from 'vue'
import type { Task, Tag } from '@main/domain'
import type { TaskStatus } from '@/kinotic/types'
import { ENERGY_LABEL } from '@/kinotic/types'
import { formatDue, isOverdue } from '@/lib/format'

const props = defineProps<{
    task: Task
    tags: Map<string, Tag>
}>()

const emit = defineEmits<{
    (e: 'edit', task: Task): void
    (e: 'move', id: string, status: TaskStatus): void
    (e: 'delete', id: string): void
}>()

const taskTags = computed(() =>
    props.task.tagIds.map(id => props.tags.get(id)).filter((t): t is Tag => !!t))

const overdue = computed(() => isOverdue(props.task.dueDate, props.task.status))

const prevStatus = computed<TaskStatus | null>(() =>
    props.task.status === 'ACTIVE' ? 'BACKLOG' : props.task.status === 'DONE' ? 'ACTIVE' : null)
const nextStatus = computed<TaskStatus | null>(() =>
    props.task.status === 'BACKLOG' ? 'ACTIVE' : props.task.status === 'ACTIVE' ? 'DONE' : null)
</script>

<template>
    <article class="card task" :class="[`accent-${task.energy === 'HIGH' ? 'rose' : task.energy === 'LOW' ? 'aqua' : 'amber'}`, { done: task.status === 'DONE' }]">
        <header>
            <button class="title" @click="emit('edit', task)">{{ task.title }}</button>
            <button class="btn btn-ghost btn-icon" title="Delete" @click="emit('delete', task.id!)">✕</button>
        </header>

        <p v-if="task.notes" class="notes subtle">{{ task.notes }}</p>

        <div class="meta">
            <span class="chip">{{ ENERGY_LABEL[task.energy as keyof typeof ENERGY_LABEL] }} energy</span>
            <span v-if="task.dueDate" class="chip due" :class="{ overdue }">{{ formatDue(task.dueDate) }}</span>
            <span
                v-for="tag in taskTags"
                :key="tag.id!"
                class="chip"
                :class="`accent-${tag.color}`"
            >{{ tag.name }}</span>
        </div>

        <footer>
            <button
                v-if="prevStatus"
                class="btn btn-sm btn-ghost"
                @click="emit('move', task.id!, prevStatus)"
            >← {{ prevStatus === 'BACKLOG' ? 'Backlog' : 'In flight' }}</button>
            <span v-else></span>
            <button
                v-if="nextStatus"
                class="btn btn-sm btn-primary"
                @click="emit('move', task.id!, nextStatus)"
            >{{ nextStatus === 'DONE' ? 'Done' : 'Start' }} →</button>
        </footer>
    </article>
</template>

<style scoped>
.task {
    padding: 0.85rem;
    display: grid;
    gap: 0.6rem;
    border-left: 3px solid var(--accent);
}
.task.done { opacity: 0.6; }
.task.done .title { text-decoration: line-through; }
header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
}
.title {
    background: none;
    border: none;
    color: var(--text-0);
    font-size: 0.95rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    padding: 0;
    line-height: 1.3;
}
.title:hover { color: var(--accent); }
.notes {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.meta { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.due.overdue {
    --accent: var(--rose);
    font-weight: 600;
}
footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}
</style>
