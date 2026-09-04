<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useWorkspace } from '@/composables/useWorkspace'
import LoginView from '@/components/LoginView.vue'
import Workspace from '@/components/Workspace.vue'

const auth = useAuth()
const ws = useWorkspace()

onMounted(() => auth.checkSession())

async function handleLogin(email: string, password: string): Promise<void> {
    await auth.login(email, password)
}

async function handleLogout(): Promise<void> {
    await auth.logout()
    ws.reset()
}
</script>

<template>
    <div class="boot" v-if="auth.state.status === 'checking'">
        <p class="muted">Connecting to Todo Neon…</p>
    </div>

    <LoginView
        v-else-if="auth.state.status === 'anonymous'"
        :busy="auth.state.busy"
        :error="auth.state.error"
        @submit="handleLogin"
    />

    <Workspace
        v-else
        :email="auth.state.email"
        @logout="handleLogout"
    />
</template>

<style scoped>
.boot {
    height: 100%;
    display: grid;
    place-items: center;
}
</style>
