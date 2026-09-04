// Mirror of the DTO shapes published by TodoNeonService
// (packages/microservices/main/src/services/types.ts). Kept in the UI because the
// frontend does not depend on the microservice package.

export type BoardAccent = 'aqua' | 'magenta' | 'lime' | 'azure' | 'amber' | 'rose'
export type TaskStatus = 'BACKLOG' | 'ACTIVE' | 'DONE'
export type TaskEnergy = 'LOW' | 'MEDIUM' | 'HIGH'

export const ACCENTS: readonly BoardAccent[] = ['aqua', 'magenta', 'lime', 'azure', 'amber', 'rose']
export const STATUSES: readonly TaskStatus[] = ['BACKLOG', 'ACTIVE', 'DONE']
export const ENERGIES: readonly TaskEnergy[] = ['LOW', 'MEDIUM', 'HIGH']

export const STATUS_LABEL: Record<TaskStatus, string> = {
    BACKLOG: 'Backlog',
    ACTIVE: 'In flight',
    DONE: 'Done',
}

export const ENERGY_LABEL: Record<TaskEnergy, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
}

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

export interface BoardStats {
    boardId: string
    backlog: number
    active: number
    done: number
    overdue: number
    total: number
}

/** Result of a TodoNeonService.vibeCheck call. */
export interface VibeCheckResult {
    boardId: string
    score: number
    verdict: string
    taskCount: number
    tookMs: number
}
