<script setup lang="ts">
import { ref } from 'vue'
import type { Tag } from '@main/domain'
import type { BoardAccent } from '@/kinotic/types'
import { ACCENTS } from '@/kinotic/types'

defineProps<{ tags: Tag[] }>()

const emit = defineEmits<{
    (e: 'create', input: { name: string; color: BoardAccent }): void
    (e: 'update', id: string, patch: { color: BoardAccent }): void
    (e: 'delete', id: string): void
    (e: 'close'): void
}>()

const name = ref('')
const color = ref<BoardAccent>('magenta')

function add(): void {
    if (!name.value.trim()) return
    emit('create', { name: name.value.trim(), color: color.value })
    name.value = ''
}

function cycle(tag: Tag): void {
    const idx = ACCENTS.indexOf(tag.color as BoardAccent)
    const next = ACCENTS[(idx + 1) % ACCENTS.length]!
    emit('update', tag.id!, { color: next })
}
</script>

<template>
    <div class="overlay" @click.self="emit('close')">
        <div class="card glow panel accent-magenta">
            <header>
                <h3>Tags</h3>
                <button class="btn btn-ghost btn-icon" @click="emit('close')">✕</button>
            </header>

            <div class="add-row">
                <input v-model="name" class="field" placeholder="New tag" @keydown.enter="add" />
                <div class="swatches">
                    <button
                        v-for="a in ACCENTS"
                        :key="a"
                        class="swatch"
                        :class="[`accent-${a}`, { on: color === a }]"
                        @click="color = a"
                    ><span class="dot"></span></button>
                </div>
                <button class="btn btn-primary btn-sm" :disabled="!name.trim()" @click="add">Add</button>
            </div>

            <ul class="list">
                <li v-for="tag in tags" :key="tag.id!" class="item" :class="`accent-${tag.color}`">
                    <button class="swatch" title="Change colour" @click="cycle(tag)"><span class="dot"></span></button>
                    <span class="name">{{ tag.name }}</span>
                    <button class="btn btn-ghost btn-sm" @click="emit('delete', tag.id!)">Remove</button>
                </li>
                <li v-if="tags.length === 0" class="muted empty">No tags yet</li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.panel {
    width: min(460px, 100%);
    padding: 1.25rem;
    display: grid;
    gap: 1rem;
}
header { display: flex; align-items: center; justify-content: space-between; }
.add-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.add-row .field { flex: 1; min-width: 140px; }
.swatches { display: flex; gap: 0.25rem; }
.swatch {
    border: 1px solid var(--line);
    background: var(--bg-0);
    border-radius: 8px;
    padding: 0.3rem;
    cursor: pointer;
    display: grid;
    place-items: center;
}
.swatch.on { border-color: var(--accent); box-shadow: 0 0 10px -2px var(--accent); }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; }
.item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
    border-radius: 10px;
}
.item .name { flex: 1; font-size: 0.9rem; }
.empty { text-align: center; padding: 1rem 0; }
</style>
