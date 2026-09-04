/**
 * Data-transfer shapes for {@link TodoNeonService}. Kept as plain interfaces so the
 * platform can derive an IDL for them and clients can build the payloads by hand.
 */

export type BoardAccent = 'aqua' | 'magenta' | 'lime' | 'azure' | 'amber' | 'rose'
export type TaskStatus = 'BACKLOG' | 'ACTIVE' | 'DONE'
export type TaskEnergy = 'LOW' | 'MEDIUM' | 'HIGH'

export interface BoardInput {
    name: string
    description?: string
    accent?: BoardAccent
}

export interface BoardPatch {
    name?: string
    description?: string
    accent?: BoardAccent
}

export interface TaskInput {
    boardId: string
    title: string
    notes?: string
    energy?: TaskEnergy
    status?: TaskStatus
    dueDate?: number
    tagIds?: string[]
}

export interface TaskPatch {
    title?: string
    notes?: string
    energy?: TaskEnergy
    dueDate?: number
}

export interface TagInput {
    name: string
    color?: BoardAccent
}

export interface TagPatch {
    name?: string
    color?: BoardAccent
}

/** A live count of a board's tasks, broken out by status. */
export interface BoardStats {
    boardId: string
    backlog: number
    active: number
    done: number
    overdue: number
    total: number
}

/** Result of a {@link TodoNeonService.vibeCheck} call. */
export interface VibeCheckResult {
    boardId: string
    score: number
    verdict: string
    taskCount: number
    tookMs: number
}
