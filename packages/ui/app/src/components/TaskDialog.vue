<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Task, Tag } from '@main/domain'
import type { TaskEnergy } from '@/kinotic/types'
import { ENERGIES, ENERGY_LABEL } from '@/kinotic/types'
import { toDateInputValue, fromDateInputValue } from '@/lib/format'

const props = defineProps<{
    task: Task
    tags: Tag[]
}>()

const emit = defineEmits<{
    (e: 'save', patch: { title: string; notes: string; energy: TaskEnergy; dueDate: number }): void
    (e: 'tags', tagIds: string[]): void
    (e: 'close'): void
}>()

const form = reactive({
    title: props.task.title,
    notes: props.task.notes,
    energy: props.task.energy as TaskEnergy,
    due: toDateInputValue(props.task.dueDate),
    tagIds: [...props.task.tagIds],
})

watch(() => props.task, next => {
    form.title = next.title
    form.notes = next.notes
    form.energy = next.energy as TaskEnergy
    form.due = toDateInputValue(next.dueDate)
    form.tagIds = [...next.tagIds]
})

function toggleTag(id: string): void {
    const idx = form.tagIds.indexOf(id)
    if (idx === -1) form.tagIds.push(id)
    else form.tagIds.splice(idx, 1)
}

function submit(): void {
    if (!form.title.trim()) return
    emit('save', {
        title: form.title.trim(),
        notes: form.notes.trim(),
        energy: form.energy,
        dueDate: fromDateInputValue(form.due),
    })
    emit('tags', [...form.tagIds])
    emit('close')
}
</script>

<template>
    <div class="overlay" @click.self="emit('close')">
        <div class="card glow dialog accent-azure">
            <header>
                <h3>Edit task</h3>
                <button class="btn btn-ghost btn-icon" @click="emit('close')">✕</button>
            </header>

            <label class="row">
                <span class="muted">Title</span>
                <input v-model="form.title" class="field" @keydown.enter="submit" />
            </label>

            <label class="row">
                <span class="muted">Notes</span>
                <textarea v-model="form.notes" class="field" rows="4"></textarea>
            </label>

            <div class="grid-2">
                <label class="row">
                    <span class="muted">Energy</span>
                    <select v-model="form.energy" class="field">
                        <option v-for="e in ENERGIES" :key="e" :value="e">{{ ENERGY_LABEL[e] }}</option>
                    </select>
                </label>
                <label class="row">
                    <span class="muted">Due date</span>
                    <input v-model="form.due" type="date" class="field" />
                </label>
            </div>

            <div class="row">
                <span class="muted">Tags</span>
                <div class="tag-picker">
                    <button
                        v-for="tag in tags"
                        :key="tag.id!"
                        type="button"
                        class="chip"
                        :class="[`accent-${tag.color}`, { off: !form.tagIds.includes(tag.id!) }]"
                        @click="toggleTag(tag.id!)"
                    >{{ tag.name }}</button>
                    <span v-if="tags.length === 0" class="muted">No tags yet</span>
                </div>
            </div>

            <footer>
                <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
                <button class="btn btn-primary" :disabled="!form.title.trim()" @click="submit">Save</button>
            </footer>
        </div>
    </div>
</template>

<style scoped>
.dialog {
    width: min(520px, 100%);
    padding: 1.25rem;
    display: grid;
    gap: 0.9rem;
    max-height: 90vh;
    overflow-y: auto;
}
header, footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
footer { gap: 0.5rem; justify-content: flex-end; }
.row { display: grid; gap: 0.35rem; font-size: 0.85rem; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.tag-picker { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip { cursor: pointer; border-style: solid; }
.chip.off { opacity: 0.4; filter: grayscale(0.6); }
textarea { resize: vertical; }
</style>
