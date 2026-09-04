export function formatDue(ms: number): string {
    if (!ms) return ''
    const due = new Date(ms)
    const now = new Date()
    const days = Math.round((startOfDay(due) - startOfDay(now)) / 86_400_000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days === -1) return 'Yesterday'
    if (days < 0) return `${-days}d overdue`
    if (days < 7) return `In ${days}d`
    return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function isOverdue(ms: number, status: string): boolean {
    return status !== 'DONE' && ms > 0 && ms < Date.now()
}

export function toDateInputValue(ms: number): string {
    if (!ms) return ''
    const d = new Date(ms)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromDateInputValue(value: string): number {
    if (!value) return 0
    const [y, m, d] = value.split('-').map(Number)
    if (!y || !m || !d) return 0
    return new Date(y, m - 1, d, 12, 0, 0, 0).getTime()
}

function startOfDay(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n)
}
