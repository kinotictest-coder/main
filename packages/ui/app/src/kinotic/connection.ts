import { Kinotic, type ConnectOptions } from '@kinotic-ai/core'
import { PersistencePlugin } from '@kinotic-ai/persistence'

const ORGANIZATION_ID = 'minds-ignited'
const APPLICATION_ID = 'todo-neon'

/** `app.<org>.<app>` — the zone Todo Neon's own services are published in. */
export const APP_ZONE = `app.${ORGANIZATION_ID}.${APPLICATION_ID}`

Kinotic.use(PersistencePlugin)

/**
 * Server override for local dev against a non-default host — `VITE_KINOTIC_HOST` /
 * `_PORT` / `_USE_SSL`. Unset, both this and `Kinotic.connect` fall back to the page's
 * own origin. There is no build-time email/password: credentials always come from the
 * login form.
 */
function serverOptions(): ConnectOptions['server'] | undefined {
    const host = import.meta.env.VITE_KINOTIC_HOST
    if (!host) return undefined
    return {
        host,
        port: import.meta.env.VITE_KINOTIC_PORT ? Number(import.meta.env.VITE_KINOTIC_PORT) : undefined,
        useSSL: import.meta.env.VITE_KINOTIC_USE_SSL === 'true',
    }
}

/** Same host `serverOptions()` would have the WebSocket upgrade hit, as a fetchable origin. */
function serverBaseUrl(server: ConnectOptions['server'] | undefined): string {
    if (!server) return window.location.origin
    const port = server.port ? `:${server.port}` : ''
    return `${server.useSSL ? 'https' : 'http'}://${server.host}${port}`
}

/**
 * Tries to resume an existing browser session with no prompt. Resolves `false` — never
 * throws — when there is no session to resume, which is the ordinary case for a user who
 * has not logged in yet.
 */
export async function connectFromSession(): Promise<boolean> {
    try {
        await Kinotic.connect({ server: serverOptions(), maxConnectionAttempts: 1 })
        return true
    } catch {
        return false
    }
}

/**
 * Interactive login for an application user (created on the portal's Members page,
 * scoped to this application). Logs in through the REST auth endpoint first — which
 * sets the session cookie the WebSocket upgrade then authenticates with — rather than
 * sending the password through a credentials resolver on every (re)connect.
 *
 * Rejects with an error whose message is fit to show the user directly: bad
 * credentials, an unknown user, or a network/server problem.
 */
export async function login(email: string, password: string): Promise<void> {
    const server = serverOptions()
    const base = serverBaseUrl(server)

    const res = await fetch(`${base}/api/auth/app/${ORGANIZATION_ID}/${APPLICATION_ID}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // stores the cross-origin Set-Cookie
        body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
        // The auth endpoint may not return a JSON body on every failure (e.g. a bare 401).
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Invalid credentials')
    }

    // The upgrade now carries the session cookie; no credentials resolver needed.
    await Kinotic.connect({ server, maxConnectionAttempts: 3 })
}

export async function logout(): Promise<void> {
    if (Kinotic.eventBus.isConnected()) await Kinotic.disconnect()
}
