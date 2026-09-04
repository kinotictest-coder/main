import { BasicCredentialsResolver, Kinotic, type ConnectOptions } from '@kinotic-ai/core'
import { PersistencePlugin } from '@kinotic-ai/persistence'

const ORGANIZATION_ID = 'minds-ignited'
const APPLICATION_ID = 'todo-neon'

/** `app.<org>.<app>` — the zone Todo Neon's own services are published in. */
export const APP_ZONE = `app.${ORGANIZATION_ID}.${APPLICATION_ID}`

Kinotic.use(PersistencePlugin)

/**
 * Server override for local dev against a non-default host — `VITE_KINOTIC_HOST` /
 * `_PORT` / `_USE_SSL`. Unset, `Kinotic.connect` falls back to the page's own origin.
 * There is no build-time email/password: credentials always come from the login form.
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
 * scoped to this application). Rejects with an error whose message is fit to show the
 * user directly — bad credentials, an unknown user, or a network/server problem.
 */
export async function login(email: string, password: string): Promise<void> {
    await Kinotic.connect({
        server: serverOptions(),
        credentials: new BasicCredentialsResolver(email, password, ORGANIZATION_ID, APPLICATION_ID),
        // Bounded so bad credentials fail fast with a message instead of retrying the
        // connection forever (the default) with no feedback on the login button.
        maxConnectionAttempts: 3,
    })
}

export async function logout(): Promise<void> {
    if (Kinotic.eventBus.isConnected()) await Kinotic.disconnect()
}
