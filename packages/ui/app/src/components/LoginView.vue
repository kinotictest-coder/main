<script setup lang="ts">
import { reactive } from 'vue'

defineProps<{
    busy: boolean
    error: string | null
}>()

const emit = defineEmits<{
    (e: 'submit', email: string, password: string): void
}>()

const form = reactive({ email: '', password: '' })

function submit(): void {
    if (!form.email.trim() || !form.password) return
    emit('submit', form.email.trim(), form.password)
}
</script>

<template>
    <div class="login">
        <form class="card glow panel accent-violet" @submit.prevent="submit">
            <div class="brand">
                <span class="dot"></span>
                <div>
                    <h1 class="neon-text">Todo Neon</h1>
                    <p class="muted">sign in to your workspace</p>
                </div>
            </div>

            <label class="row">
                <span class="muted">Email</span>
                <input
                    v-model="form.email"
                    type="email"
                    class="field"
                    autocomplete="username"
                    autofocus
                    required
                />
            </label>

            <label class="row">
                <span class="muted">Password</span>
                <input
                    v-model="form.password"
                    type="password"
                    class="field"
                    autocomplete="current-password"
                    required
                />
            </label>

            <p v-if="error" class="error">{{ error }}</p>

            <button class="btn btn-primary submit" type="submit" :disabled="busy || !form.email.trim() || !form.password">
                {{ busy ? 'Signing in…' : 'Sign in' }}
            </button>

            <p class="hint muted">
                Application users are created on the Kinotic portal's
                <strong>Application &rarr; Members</strong> page.
            </p>
        </form>
    </div>
</template>

<style scoped>
.login {
    height: 100%;
    display: grid;
    place-items: center;
    padding: 1.5rem;
}
.panel {
    width: min(380px, 100%);
    padding: 1.75rem;
    display: grid;
    gap: 1rem;
}
.brand { display: flex; gap: 0.6rem; align-items: flex-start; margin-bottom: 0.25rem; }
.brand h1 { font-size: 1.3rem; }
.brand p { font-size: 0.78rem; margin: 0.2rem 0 0; }
.brand .dot { margin-top: 0.4rem; }
.row { display: grid; gap: 0.35rem; font-size: 0.85rem; }
.submit { justify-content: center; padding: 0.7rem; font-size: 0.9rem; }
.error {
    margin: 0;
    padding: 0.55rem 0.7rem;
    border-radius: 10px;
    font-size: 0.8rem;
    color: var(--rose);
    background: color-mix(in srgb, var(--rose) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--rose) 40%, var(--line));
}
.hint { font-size: 0.72rem; text-align: center; margin: 0; }
</style>
