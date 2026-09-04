import { reactive } from 'vue'
import { connectFromSession, login as loginRequest, logout as logoutRequest } from '@/kinotic/connection'

export type AuthStatus = 'checking' | 'anonymous' | 'authenticated'

interface AuthState {
    status: AuthStatus
    email: string
    busy: boolean
    error: string | null
}

const state = reactive<AuthState>({
    status: 'checking',
    email: '',
    busy: false,
    error: null,
})

export function useAuth() {

    /** Runs once at boot: resumes a browser session if one exists, otherwise shows login. */
    async function checkSession(): Promise<void> {
        state.status = 'checking'
        state.status = (await connectFromSession()) ? 'authenticated' : 'anonymous'
    }

    async function login(email: string, password: string): Promise<void> {
        state.busy = true
        state.error = null
        try {
            await loginRequest(email, password)
            state.email = email
            state.status = 'authenticated'
        } catch (err) {
            state.error = err instanceof Error ? err.message : String(err)
        } finally {
            state.busy = false
        }
    }

    async function logout(): Promise<void> {
        await logoutRequest()
        state.email = ''
        state.status = 'anonymous'
    }

    return { state, checkSession, login, logout }
}
