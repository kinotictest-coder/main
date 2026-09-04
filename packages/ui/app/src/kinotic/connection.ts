import { BasicCredentialsResolver, Kinotic, type ConnectOptions } from '@kinotic-ai/core'
import { PersistencePlugin } from '@kinotic-ai/persistence'

const ORGANIZATION_ID = 'minds-ignited'
const APPLICATION_ID = 'todo-neon'

/** `app.<org>.<app>` — the zone Todo Neon's own services are published in. */
export const APP_ZONE = `app.${ORGANIZATION_ID}.${APPLICATION_ID}`

let connecting: Promise<void> | null = null

/**
 * Connects the Kinotic singleton once and registers the persistence plugin.
 *
 * Server: `VITE_KINOTIC_HOST` / `_PORT` / `_USE_SSL`, or the page origin when unset.
 * Credentials: `VITE_KINOTIC_EMAIL` + `VITE_KINOTIC_PASSWORD` (an application user
 * created on the portal Members page), or the browser session cookie when unset.
 */
export function connect(): Promise<void> {
    if (!connecting) {
        connecting = doConnect().catch(err => {
            connecting = null
            throw err
        })
    }
    return connecting
}

async function doConnect(): Promise<void> {
    Kinotic.use(PersistencePlugin)

    const options: ConnectOptions = {}

    const host = import.meta.env.VITE_KINOTIC_HOST
    if (host) {
        options.server = {
            host,
            port: import.meta.env.VITE_KINOTIC_PORT ? Number(import.meta.env.VITE_KINOTIC_PORT) : undefined,
            useSSL: import.meta.env.VITE_KINOTIC_USE_SSL === 'true',
        }
    }

    const email = import.meta.env.VITE_KINOTIC_EMAIL
    const password = import.meta.env.VITE_KINOTIC_PASSWORD
    if (email && password) {
        options.credentials = new BasicCredentialsResolver(email, password, ORGANIZATION_ID, APPLICATION_ID)
    }

    await Kinotic.connect(options)
}
