<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Task } from '@main/domain'
import { useWorkspace } from '@/composables/useWorkspace'
import { STATUSES, STATUS_LABEL, ACCENTS } from '@/kinotic/types'
import type { BoardAccent, TaskEnergy, TaskStatus } from '@/kinotic/types'
import BoardRail from '@/components/BoardRail.vue'
import TaskColumn from '@/components/TaskColumn.vue'
import TaskDialog from '@/components/TaskDialog.vue'
import TagManager from '@/components/TagManager.vue'
import StatBar from '@/components/StatBar.vue'

const ws = useWorkspace()

const quickTitle = ref('')
const quickEnergy = ref<TaskEnergy>('MEDIUM')
const editing = ref<Task | null>(null)
const showTags = ref(false)

onMounted(() => ws.init())

const board = ws.selectedBoard
const columns = ws.columns
const stats = ws.stats
const tagById = ws.tagById

const boardAccentClass = computed(() => `accent-${board.value?.accent ?? 'aqua'}`)

async function quickAdd(): Promise<void> {
    const title = quickTitle.value.trim()
    if (!title || !board.value) return
    await ws.addTask({ title, energy: quickEnergy.value })
    quickTitle.value = ''
}

function cycleAccent(): void {
    if (!board.value?.id) return
    const idx = ACCENTS.indexOf(board.value.accent as BoardAccent)
    const next = ACCENTS[(idx + 1) % ACCENTS.length]!
    ws.updateBoard(board.value.id, { accent: next })
}

function renameBoard(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim()
    if (board.value?.id && value && value !== board.value.name) {
        ws.updateBoard(board.value.id, { name: value })
    }
}

async function removeBoard(): Promise<void> {
    if (!board.value?.id) return
    if (confirm(`Delete "${board.value.name}" and all its tasks?`)) {
        await ws.deleteBoard(board.value.id)
    }
}

function saveEdit(patch: { title: string; notes: string; energy: TaskEnergy; dueDate: number }): void {
    if (editing.value?.id) ws.updateTask(editing.value.id, patch)
}
function saveEditTags(tagIds: string[]): void {
    if (editing.value?.id) ws.setTags(editing.value.id, tagIds)
}
</script>

<template>
    <div class="shell">
        <BoardRail
            :boards="ws.state.boards"
            :selected-id="ws.state.selectedBoardId"
            @select="ws.selectBoard"
            @create="ws.createBoard"
        />

        <main class="stage" :class="boardAccentClass">
            <div v-if="ws.state.loading && !ws.state.ready" class="center muted">Connecting to Todo Neon…</div>

            <div v-else-if="ws.state.error && !ws.state.ready" class="center">
                <div class="card glow accent-rose err">
                    <h3>Can't reach the workspace</h3>
                    <p class="subtle">{{ ws.state.error }}</p>
                    <p class="muted small">
                        The UI talks to the published <code>TodoNeonService</code>, which only answers
                        while the project deployment is running. Check the deployment, then reload.
                    </p>
                    <button class="btn btn-primary" @click="ws.init()">Retry</button>
                </div>
            </div>

            <div v-else-if="!board" class="center muted">
                <div class="card empty-board accent-aqua">
                    <h3 class="neon-text">No boards yet</h3>
                    <p class="subtle">Create your first board from the left rail to start dropping tasks.</p>
                </div>
            </div>

            <template v-else>
                <header class="topbar">
                    <div class="title-wrap">
                        <button class="swatch" title="Cycle accent" @click="cycleAccent"><span class="dot"></span></button>
                        <input
                            :key="board.id!"
                            class="board-title"
                            :value="board.name"
                            @change="renameBoard"
                            @keydown.enter="($event.target as HTMLInputElement).blur()"
                        />
                    </div>
                    <div class="actions">
                        <button class="btn btn-ghost" @click="showTags = true">Tags</button>
                        <button class="btn btn-ghost" @click="removeBoard">Delete board</button>
                    </div>
                </header>

                <StatBar v-if="stats" :stats="stats" />

                <form class="quick card" :class="boardAccentClass" @submit.prevent="quickAdd">
                    <input
                        v-model="quickTitle"
                        class="field"
                        placeholder="Add a task and hit enter…"
                    />
                    <select v-model="quickEnergy" class="field energy">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </select>
                    <button class="btn btn-primary" type="submit" :disabled="!quickTitle.trim()">Add</button>
                </form>

                <p v-if="ws.state.error" class="inline-err subtle">{{ ws.state.error }}</p>

                <div class="columns">
                    <TaskColumn
                        v-for="status in STATUSES"
                        :key="status"
                        :status="status"
                        :label="STATUS_LABEL[status]"
                        :tasks="columns[status]"
                        :tags="tagById"
                        @edit="editing = $event"
                        @move="(id: string, s: TaskStatus) => ws.moveTask(id, s, Date.now())"
                        @delete="ws.deleteTask"
                    />
                </div>
            </template>
        </main>

        <TaskDialog
            v-if="editing"
            :task="editing"
            :tags="ws.state.tags"
            @save="saveEdit"
            @tags="saveEditTags"
            @close="editing = null"
        />

        <TagManager
            v-if="showTags"
            :tags="ws.state.tags"
            @create="ws.createTag"
            @update="ws.updateTag"
            @delete="ws.deleteTag"
            @close="showTags = false"
        />
    </div>
</template>

<style scoped>
.shell { display: flex; height: 100%; overflow: hidden; }
.stage {
    flex: 1;
    padding: 1.5rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: hidden;
}
.center { flex: 1; display: grid; place-items: center; text-align: center; }
.err, .empty-board { padding: 1.5rem; display: grid; gap: 0.6rem; max-width: 420px; }
.small { font-size: 0.78rem; }

.topbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.title-wrap { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
.board-title {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-0);
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    padding: 0.2rem 0.4rem;
    border-radius: 8px;
    min-width: 0;
}
.board-title:hover { border-color: var(--line); }
.board-title:focus { outline: none; border-color: var(--accent); }
.actions { display: flex; gap: 0.5rem; flex: none; }
.swatch {
    border: 1px solid var(--line);
    background: var(--bg-0);
    border-radius: 8px;
    padding: 0.4rem;
    cursor: pointer;
    display: grid;
    place-items: center;
    flex: none;
}

.quick {
    display: flex;
    gap: 0.6rem;
    padding: 0.6rem;
    align-items: center;
}
.quick .field { flex: 1; background: var(--bg-1); }
.quick .energy { flex: none; width: 110px; background: var(--bg-1); }

.inline-err { color: var(--rose); font-size: 0.8rem; }

.columns {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    overflow: hidden;
    min-height: 0;
}

@media (max-width: 860px) {
    .columns { grid-template-columns: 1fr; overflow-y: auto; }
}
</style>
