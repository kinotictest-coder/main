import { Publish, Version, Pageable } from '@kinotic-ai/core'
import { Board, Task, Tag, BoardRepository, TaskRepository, TagRepository } from '@main/domain'
import type {
    BoardInput, BoardPatch,
    TaskInput, TaskPatch,
    TagInput, TagPatch,
    BoardStats,
    TaskStatus, TaskEnergy, BoardAccent,
} from './types.js'

const ACCENTS: readonly BoardAccent[] = ['aqua', 'magenta', 'lime', 'violet', 'amber', 'rose']
const STATUSES: readonly TaskStatus[] = ['BACKLOG', 'ACTIVE', 'DONE']
const ENERGIES: readonly TaskEnergy[] = ['LOW', 'MEDIUM', 'HIGH']

// Repositories expose findAll / findById / search but no "find by field" query, so the
// service pages everything in and filters in memory. A personal todo board is small;
// this cap is a guard-rail, not an expected size.
const MAX_ROWS = 2000

/**
 * The one published entry point for Todo Neon. Holds every write rule the clients
 * would otherwise have to duplicate: timestamps, ordering, status transitions, and
 * the cascades that keep boards, tasks and tags consistent.
 *
 * Runs at organization scope inside the deployment (see the `services` skill); the
 * frontend reaches it through a service proxy at
 * `app.minds-ignited.todo-neon~io.kinotic.todoneon.TodoNeonService`.
 */
@Publish('io.kinotic.todoneon')
@Version('1.0.0')
export class TodoNeonService {

    private readonly boards: BoardRepository = new BoardRepository()
    private readonly tasks: TaskRepository = new TaskRepository()
    private readonly tags: TagRepository = new TagRepository()

    // ---------------------------------------------------------------- Boards

    async listBoards(includeArchived: boolean = false): Promise<Board[]> {
        const all = await this.loadAll(this.boards)
        return all
            .filter(b => includeArchived || !b.archived)
            .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)
    }

    async getBoard(id: string): Promise<Board> {
        return this.requireBoard(id)
    }

    async createBoard(input: BoardInput): Promise<Board> {
        const name = this.requireText(input.name, 'board name')
        const now = Date.now()
        const existing = await this.loadAll(this.boards)
        const board = new Board()
        board.id = null
        board.name = name
        board.description = input.description?.trim() ?? ''
        board.accent = this.pick(input.accent, ACCENTS, 'aqua')
        board.position = existing.reduce((max, b) => Math.max(max, b.position), 0) + 1
        board.archived = false
        board.createdAt = now
        board.updatedAt = now
        return this.boards.save(board)
    }

    async updateBoard(id: string, patch: BoardPatch): Promise<Board> {
        const board = await this.requireBoard(id)
        if (patch.name !== undefined) board.name = this.requireText(patch.name, 'board name')
        if (patch.description !== undefined) board.description = patch.description.trim()
        if (patch.accent !== undefined) board.accent = this.pick(patch.accent, ACCENTS, board.accent as BoardAccent)
        board.updatedAt = Date.now()
        return this.boards.save(board)
    }

    /** Place a board at an explicit sort position (clients pass a fractional midpoint). */
    async reorderBoard(id: string, position: number): Promise<Board> {
        const board = await this.requireBoard(id)
        board.position = position
        board.updatedAt = Date.now()
        return this.boards.save(board)
    }

    async archiveBoard(id: string, archived: boolean): Promise<Board> {
        const board = await this.requireBoard(id)
        board.archived = archived
        board.updatedAt = Date.now()
        return this.boards.save(board)
    }

    /** Deletes the board and every task on it. */
    async deleteBoard(id: string): Promise<void> {
        await this.requireBoard(id)
        const doomed = (await this.loadAll(this.tasks)).filter(t => t.boardId === id)
        for (const task of doomed) {
            if (task.id) await this.tasks.deleteById(task.id)
        }
        await this.boards.deleteById(id)
    }

    // ---------------------------------------------------------------- Tasks

    async listTasks(boardId: string): Promise<Task[]> {
        const all = await this.loadAll(this.tasks)
        return all
            .filter(t => t.boardId === boardId)
            .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)
    }

    async searchTasks(text: string): Promise<Task[]> {
        const query = text?.trim()
        if (!query) return []
        const page = await this.tasks.search(query, Pageable.create(0, 100))
        return page.content ?? []
    }

    async createTask(input: TaskInput): Promise<Task> {
        const board = await this.requireBoard(input.boardId)
        const title = this.requireText(input.title, 'task title')
        const now = Date.now()
        const status = this.pick(input.status, STATUSES, 'BACKLOG')
        const task = new Task()
        task.id = null
        task.boardId = board.id as string
        task.title = title
        task.notes = input.notes?.trim() ?? ''
        task.energy = this.pick(input.energy, ENERGIES, 'MEDIUM')
        task.status = status
        task.tagIds = await this.validTagIds(input.tagIds)
        task.dueDate = this.normalizeDate(input.dueDate)
        task.position = now
        task.completedAt = status === 'DONE' ? now : 0
        task.createdAt = now
        task.updatedAt = now
        return this.tasks.save(task)
    }

    async updateTask(id: string, patch: TaskPatch): Promise<Task> {
        const task = await this.requireTask(id)
        if (patch.title !== undefined) task.title = this.requireText(patch.title, 'task title')
        if (patch.notes !== undefined) task.notes = patch.notes.trim()
        if (patch.energy !== undefined) task.energy = this.pick(patch.energy, ENERGIES, task.energy as TaskEnergy)
        if (patch.dueDate !== undefined) task.dueDate = this.normalizeDate(patch.dueDate)
        task.updatedAt = Date.now()
        return this.tasks.save(task)
    }

    /** Move a task to another board and/or status column at an explicit position. */
    async moveTask(id: string, boardId: string, status: TaskStatus, position: number): Promise<Task> {
        const task = await this.requireTask(id)
        await this.requireBoard(boardId)
        const nextStatus = this.pick(status, STATUSES, task.status as TaskStatus)
        task.boardId = boardId
        this.applyStatus(task, nextStatus)
        task.position = position
        task.updatedAt = Date.now()
        return this.tasks.save(task)
    }

    async setStatus(id: string, status: TaskStatus): Promise<Task> {
        const task = await this.requireTask(id)
        this.applyStatus(task, this.pick(status, STATUSES, task.status as TaskStatus))
        task.updatedAt = Date.now()
        return this.tasks.save(task)
    }

    async setTags(id: string, tagIds: string[]): Promise<Task> {
        const task = await this.requireTask(id)
        task.tagIds = await this.validTagIds(tagIds)
        task.updatedAt = Date.now()
        return this.tasks.save(task)
    }

    async deleteTask(id: string): Promise<void> {
        await this.requireTask(id)
        await this.tasks.deleteById(id)
    }

    // ---------------------------------------------------------------- Tags

    async listTags(): Promise<Tag[]> {
        const all = await this.loadAll(this.tags)
        return all.sort((a, b) => a.name.localeCompare(b.name))
    }

    async createTag(input: TagInput): Promise<Tag> {
        const name = this.requireText(input.name, 'tag name')
        const now = Date.now()
        const tag = new Tag()
        tag.id = null
        tag.name = name
        tag.color = this.pick(input.color, ACCENTS, 'aqua')
        tag.createdAt = now
        tag.updatedAt = now
        return this.tags.save(tag)
    }

    async updateTag(id: string, patch: TagPatch): Promise<Tag> {
        const tag = await this.requireTag(id)
        if (patch.name !== undefined) tag.name = this.requireText(patch.name, 'tag name')
        if (patch.color !== undefined) tag.color = this.pick(patch.color, ACCENTS, tag.color as BoardAccent)
        tag.updatedAt = Date.now()
        return this.tags.save(tag)
    }

    /** Deletes the tag and strips it from every task carrying it. */
    async deleteTag(id: string): Promise<void> {
        await this.requireTag(id)
        const affected = (await this.loadAll(this.tasks)).filter(t => t.tagIds.includes(id))
        for (const task of affected) {
            task.tagIds = task.tagIds.filter(tagId => tagId !== id)
            task.updatedAt = Date.now()
            await this.tasks.save(task)
        }
        await this.tags.deleteById(id)
    }

    // ---------------------------------------------------------------- Dashboard

    async boardStats(boardId: string): Promise<BoardStats> {
        await this.requireBoard(boardId)
        const now = Date.now()
        const tasks = (await this.loadAll(this.tasks)).filter(t => t.boardId === boardId)
        const stats: BoardStats = { boardId, backlog: 0, active: 0, done: 0, overdue: 0, total: tasks.length }
        for (const task of tasks) {
            if (task.status === 'BACKLOG') stats.backlog++
            else if (task.status === 'ACTIVE') stats.active++
            else if (task.status === 'DONE') stats.done++
            if (task.status !== 'DONE' && task.dueDate > 0 && task.dueDate < now) stats.overdue++
        }
        return stats
    }

    // ---------------------------------------------------------------- internals

    private applyStatus(task: Task, status: TaskStatus): void {
        task.status = status
        if (status === 'DONE') {
            if (task.completedAt === 0) task.completedAt = Date.now()
        } else {
            task.completedAt = 0
        }
    }

    private async validTagIds(ids: string[] | undefined): Promise<string[]> {
        if (!ids || ids.length === 0) return []
        const unique = [...new Set(ids)]
        const found = await this.tags.findByIds(unique)
        const known = new Set(found.map(t => t.id))
        return unique.filter(id => known.has(id))
    }

    private normalizeDate(value: number | undefined): number {
        return typeof value === 'number' && value > 0 ? Math.floor(value) : 0
    }

    private pick<T extends string>(value: T | undefined, allowed: readonly T[], fallback: T): T {
        return value !== undefined && allowed.includes(value) ? value : fallback
    }

    private requireText(value: string | undefined, label: string): string {
        const trimmed = value?.trim() ?? ''
        if (!trimmed) throw new Error(`A ${label} is required`)
        return trimmed
    }

    private async requireBoard(id: string): Promise<Board> {
        const board = id ? await this.boards.findById(id) : null
        if (!board) throw new Error(`No board with id ${id}`)
        return board
    }

    private async requireTask(id: string): Promise<Task> {
        const task = id ? await this.tasks.findById(id) : null
        if (!task) throw new Error(`No task with id ${id}`)
        return task
    }

    private async requireTag(id: string): Promise<Tag> {
        const tag = id ? await this.tags.findById(id) : null
        if (!tag) throw new Error(`No tag with id ${id}`)
        return tag
    }

    private async loadAll<T>(repo: { findAll(p: Pageable): Promise<{ content?: T[] | null }> }): Promise<T[]> {
        const out: T[] = []
        const pageSize = 200
        for (let page = 0; page * pageSize < MAX_ROWS; page++) {
            const result = await repo.findAll(Pageable.create(page, pageSize))
            const rows = result.content ?? []
            out.push(...rows)
            if (rows.length < pageSize) break
        }
        return out
    }
}
