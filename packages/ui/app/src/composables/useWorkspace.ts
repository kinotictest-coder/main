import { computed, reactive } from 'vue'
import type { Board, Task, Tag } from '@main/domain'
import { connect } from '@/kinotic/connection'
import { todoNeon } from '@/kinotic/todoNeonService'
import type {
    BoardInput, BoardPatch, TaskInput, TaskPatch, TagInput, TagPatch,
    TaskStatus, BoardStats,
} from '@/kinotic/types'

interface WorkspaceState {
    ready: boolean
    loading: boolean
    error: string | null
    boards: Board[]
    tags: Tag[]
    tasks: Task[]
    selectedBoardId: string | null
}

const state = reactive<WorkspaceState>({
    ready: false,
    loading: false,
    error: null,
    boards: [],
    tags: [],
    tasks: [],
    selectedBoardId: null,
})

const svc = todoNeon

function sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)
}

function replaceTask(next: Task): void {
    const idx = state.tasks.findIndex(t => t.id === next.id)
    if (idx === -1) state.tasks.push(next)
    else state.tasks[idx] = next
}

async function guard<T>(fn: () => Promise<T>): Promise<T | undefined> {
    state.error = null
    try {
        return await fn()
    } catch (err) {
        state.error = err instanceof Error ? err.message : String(err)
        return undefined
    }
}

export function useWorkspace() {

    const selectedBoard = computed(() =>
        state.boards.find(b => b.id === state.selectedBoardId) ?? null)

    const boardTasks = computed(() =>
        sortTasks(state.tasks.filter(t => t.boardId === state.selectedBoardId)))

    const columns = computed(() => ({
        BACKLOG: boardTasks.value.filter(t => t.status === 'BACKLOG'),
        ACTIVE: boardTasks.value.filter(t => t.status === 'ACTIVE'),
        DONE: boardTasks.value.filter(t => t.status === 'DONE'),
    }))

    const stats = computed<BoardStats | null>(() => {
        const board = selectedBoard.value
        if (!board) return null
        const now = Date.now()
        const list = boardTasks.value
        return {
            boardId: board.id ?? '',
            backlog: list.filter(t => t.status === 'BACKLOG').length,
            active: list.filter(t => t.status === 'ACTIVE').length,
            done: list.filter(t => t.status === 'DONE').length,
            overdue: list.filter(t => t.status !== 'DONE' && t.dueDate > 0 && t.dueDate < now).length,
            total: list.length,
        }
    })

    const tagById = computed(() => {
        const map = new Map<string, Tag>()
        for (const tag of state.tags) if (tag.id) map.set(tag.id, tag)
        return map
    })

    async function init(): Promise<void> {
        if (state.ready || state.loading) return
        state.loading = true
        state.error = null
        try {
            await connect()
            const [boards, tags] = await Promise.all([svc().listBoards(false), svc().listTags()])
            state.boards = boards
            state.tags = tags
            if (boards.length > 0) await selectBoard(boards[0]!.id ?? null)
            state.ready = true
        } catch (err) {
            state.error = err instanceof Error ? err.message : String(err)
        } finally {
            state.loading = false
        }
    }

    async function selectBoard(boardId: string | null): Promise<void> {
        state.selectedBoardId = boardId
        if (!boardId) return
        const tasks = await guard(() => svc().listTasks(boardId))
        if (tasks) {
            state.tasks = state.tasks.filter(t => t.boardId !== boardId).concat(tasks)
        }
    }

    async function createBoard(input: BoardInput): Promise<void> {
        const board = await guard(() => svc().createBoard(input))
        if (board) {
            state.boards.push(board)
            await selectBoard(board.id ?? null)
        }
    }

    async function updateBoard(id: string, patch: BoardPatch): Promise<void> {
        const board = await guard(() => svc().updateBoard(id, patch))
        if (board) {
            const idx = state.boards.findIndex(b => b.id === id)
            if (idx !== -1) state.boards[idx] = board
        }
    }

    async function archiveBoard(id: string): Promise<void> {
        const ok = await guard(() => svc().archiveBoard(id, true))
        if (ok) {
            state.boards = state.boards.filter(b => b.id !== id)
            if (state.selectedBoardId === id) {
                await selectBoard(state.boards[0]?.id ?? null)
            }
        }
    }

    async function deleteBoard(id: string): Promise<void> {
        const done = await guard(() => svc().deleteBoard(id))
        if (done !== undefined) {
            state.boards = state.boards.filter(b => b.id !== id)
            state.tasks = state.tasks.filter(t => t.boardId !== id)
            if (state.selectedBoardId === id) {
                await selectBoard(state.boards[0]?.id ?? null)
            }
        }
    }

    async function addTask(input: Omit<TaskInput, 'boardId'>): Promise<void> {
        if (!state.selectedBoardId) return
        const task = await guard(() => svc().createTask({ ...input, boardId: state.selectedBoardId! }))
        if (task) replaceTask(task)
    }

    async function updateTask(id: string, patch: TaskPatch): Promise<void> {
        const task = await guard(() => svc().updateTask(id, patch))
        if (task) replaceTask(task)
    }

    async function setStatus(id: string, status: TaskStatus): Promise<void> {
        const task = await guard(() => svc().setStatus(id, status))
        if (task) replaceTask(task)
    }

    async function moveTask(id: string, status: TaskStatus, position: number): Promise<void> {
        const task = state.tasks.find(t => t.id === id)
        if (!task) return
        const saved = await guard(() => svc().moveTask(id, task.boardId, status, position))
        if (saved) replaceTask(saved)
    }

    async function setTags(id: string, tagIds: string[]): Promise<void> {
        const task = await guard(() => svc().setTags(id, tagIds))
        if (task) replaceTask(task)
    }

    async function deleteTask(id: string): Promise<void> {
        const done = await guard(() => svc().deleteTask(id))
        if (done !== undefined) state.tasks = state.tasks.filter(t => t.id !== id)
    }

    async function createTag(input: TagInput): Promise<void> {
        const tag = await guard(() => svc().createTag(input))
        if (tag) state.tags.push(tag)
    }

    async function updateTag(id: string, patch: TagPatch): Promise<void> {
        const tag = await guard(() => svc().updateTag(id, patch))
        if (tag) {
            const idx = state.tags.findIndex(t => t.id === id)
            if (idx !== -1) state.tags[idx] = tag
        }
    }

    async function deleteTag(id: string): Promise<void> {
        const done = await guard(() => svc().deleteTag(id))
        if (done !== undefined) {
            state.tags = state.tags.filter(t => t.id !== id)
            for (const task of state.tasks) {
                if (task.tagIds.includes(id)) task.tagIds = task.tagIds.filter(x => x !== id)
            }
        }
    }

    return {
        state,
        selectedBoard,
        boardTasks,
        columns,
        stats,
        tagById,
        init,
        selectBoard,
        createBoard,
        updateBoard,
        archiveBoard,
        deleteBoard,
        addTask,
        updateTask,
        setStatus,
        moveTask,
        setTags,
        deleteTask,
        createTag,
        updateTag,
        deleteTag,
    }
}
