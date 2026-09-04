import { Kinotic, type IServiceProxy } from '@kinotic-ai/core'
import type { Board, Task, Tag } from '@main/domain'
import { APP_ZONE } from './connection.js'
import type {
    BoardInput, BoardPatch,
    TaskInput, TaskPatch,
    TagInput, TagPatch,
    BoardStats, TaskStatus,
} from './types.js'

const ADDRESS = `${APP_ZONE}~io.kinotic.todoneon.TodoNeonService`

/**
 * Hand-written proxy for the published `TodoNeonService`. Every call resolves only
 * while the deployment is running (see the `deploying` skill) — a dead deployment
 * surfaces here as an invocation that never resolves / rejects.
 */
export class TodoNeonService {

    private readonly proxy: IServiceProxy

    constructor() {
        this.proxy = Kinotic.serviceProxy(ADDRESS)
    }

    // Boards
    listBoards(): Promise<Board[]> {
        return this.proxy.invoke('listBoards', [])
    }
    createBoard(input: BoardInput): Promise<Board> {
        return this.proxy.invoke('createBoard', [input])
    }
    updateBoard(id: string, patch: BoardPatch): Promise<Board> {
        return this.proxy.invoke('updateBoard', [id, patch])
    }
    reorderBoard(id: string, position: number): Promise<Board> {
        return this.proxy.invoke('reorderBoard', [id, position])
    }
    archiveBoard(id: string, archived: boolean): Promise<Board> {
        return this.proxy.invoke('archiveBoard', [id, archived])
    }
    deleteBoard(id: string): Promise<void> {
        return this.proxy.invoke('deleteBoard', [id])
    }

    // Tasks
    listTasks(boardId: string): Promise<Task[]> {
        return this.proxy.invoke('listTasks', [boardId])
    }
    searchTasks(text: string): Promise<Task[]> {
        return this.proxy.invoke('searchTasks', [text])
    }
    createTask(input: TaskInput): Promise<Task> {
        return this.proxy.invoke('createTask', [input])
    }
    updateTask(id: string, patch: TaskPatch): Promise<Task> {
        return this.proxy.invoke('updateTask', [id, patch])
    }
    moveTask(id: string, boardId: string, status: TaskStatus, position: number): Promise<Task> {
        return this.proxy.invoke('moveTask', [id, boardId, status, position])
    }
    setStatus(id: string, status: TaskStatus): Promise<Task> {
        return this.proxy.invoke('setStatus', [id, status])
    }
    setTags(id: string, tagIds: string[]): Promise<Task> {
        return this.proxy.invoke('setTags', [id, tagIds])
    }
    deleteTask(id: string): Promise<void> {
        return this.proxy.invoke('deleteTask', [id])
    }

    // Tags
    listTags(): Promise<Tag[]> {
        return this.proxy.invoke('listTags', [])
    }
    createTag(input: TagInput): Promise<Tag> {
        return this.proxy.invoke('createTag', [input])
    }
    updateTag(id: string, patch: TagPatch): Promise<Tag> {
        return this.proxy.invoke('updateTag', [id, patch])
    }
    deleteTag(id: string): Promise<void> {
        return this.proxy.invoke('deleteTag', [id])
    }

    // Dashboard
    boardStats(boardId: string): Promise<BoardStats> {
        return this.proxy.invoke('boardStats', [boardId])
    }
}

/** Shared singleton — constructed lazily after {@link connect}. */
let instance: TodoNeonService | null = null
export function todoNeon(): TodoNeonService {
    if (!instance) instance = new TodoNeonService()
    return instance
}
