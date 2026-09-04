<script setup lang="ts">
import { ref } from 'vue'
import type { Board } from '@main/domain'
import type { BoardAccent } from '@/kinotic/types'
import { ACCENTS } from '@/kinotic/types'

defineProps<{
    boards: Board[]
    selectedId: string | null
    email: string
}>()

const emit = defineEmits<{
    (e: 'select', id: string): void
    (e: 'create', input: { name: string; accent: BoardAccent }): void
    (e: 'logout'): void
}>()

const creating = ref(false)
const name = ref('')
const accent = ref<BoardAccent>('aqua')

function submit(): void {
    if (!name.value.trim()) return
    emit('create', { name: name.value.trim(), accent: accent.value })
    name.value = ''
    accent.value = 'aqua'
    creating.value = false
}
</script>

<template>
    <aside class="rail">
        <div class="brand">
            <span class="dot"></span>
            <div>
                <h1 class="neon-text">Todo Neon</h1>
                <p class="muted">glow-in-the-dark task board</p>
            </div>
        </div>

        <nav>
            <button
                v-for="board in boards"
                :key="board.id!"
                class="board-btn"
                :class="[`accent-${board.accent}`, { active: board.id === selectedId }]"
                @click="emit('select', board.id!)"
            >
                <span class="dot"></span>
                <span class="label">{{ board.name }}</span>
            </button>
        </nav>

        <div v-if="creating" class="create card accent-aqua">
            <input
                v-model="name"
                class="field"
                placeholder="Board name"
                autofocus
                @keydown.enter="submit"
                @keydown.esc="creating = false"
            />
            <div class="swatches">
                <button
                    v-for="a in ACCENTS"
                    :key="a"
                    class="swatch"
                    :class="[`accent-${a}`, { on: accent === a }]"
                    @click="accent = a"
                ><span class="dot"></span></button>
            </div>
            <div class="create-actions">
                <button class="btn btn-ghost btn-sm" @click="creating = false">Cancel</button>
                <button class="btn btn-primary btn-sm" :disabled="!name.trim()" @click="submit">Add board</button>
            </div>
        </div>
        <button v-else class="btn btn-ghost add" @click="creating = true">+ New board</button>

        <footer class="account">
            <span class="email muted" :title="email">{{ email }}</span>
            <button class="btn btn-ghost btn-sm" @click="emit('logout')">Sign out</button>
        </footer>
    </aside>
</template>

<style scoped>
.rail {
    width: 264px;
    flex: none;
    border-right: 1px solid var(--line);
    padding: 1.25rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background: linear-gradient(180deg, var(--bg-1), var(--bg-0));
    overflow-y: auto;
}
.account {
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}
.email {
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}
.brand { display: flex; gap: 0.6rem; align-items: flex-start; }
.brand h1 { font-size: 1.15rem; }
.brand p { font-size: 0.72rem; margin: 0.15rem 0 0; }
.brand .dot {
    margin-top: 0.35rem;
    animation: neon-pulse 2.4s ease-in-out infinite;
}

@keyframes neon-pulse {
    0%, 100% { box-shadow: 0 0 6px var(--accent); opacity: 0.8; }
    50% { box-shadow: 0 0 16px var(--accent), 0 0 28px var(--accent); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
    .brand .dot { animation: none; }
}

nav { display: flex; flex-direction: column; gap: 0.35rem; }
.board-btn {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.55rem 0.65rem;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-1);
    cursor: pointer;
    text-align: left;
    font-size: 0.88rem;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.board-btn:hover { background: var(--bg-2); color: var(--text-0); }
.board-btn.active {
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-2));
    border-color: color-mix(in srgb, var(--accent) 50%, transparent);
    color: var(--text-0);
}
.label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.add { justify-content: center; }
.create { padding: 0.75rem; display: grid; gap: 0.6rem; }
.swatches { display: flex; gap: 0.35rem; }
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
.create-actions { display: flex; justify-content: flex-end; gap: 0.4rem; }
</style>
