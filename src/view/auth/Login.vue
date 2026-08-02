<script setup>
import { supabase } from '@/services/supabase';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const errorMessage = ref('')
const loading = ref(false)
const form = reactive({
    email: '',
    password: '',
})

const handleLogin = async () => {
    try {
        loading.value = true
        errorMessage.value = ''
        const { data, error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
        })
        if (error) throw error
        router.push('/')
    } catch (error) {
        errorMessage.value = error.message
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="auth-form">
        <h1>Login</h1>
        <form @submit.prevent="handleLogin">
            <span class="error">{{ errorMessage }}</span>
            <input type="email" name="email" id="email" v-model="form.email" placeholder="example@gmail.com" required>
            <input type="password" name="password" id="password" v-model="form.password" placeholder="your password" required>
            <button class="btn-submit">
                {{ loading ? 'Login ...' : 'Login' }}
            </button>
            <p>Don't have account? <router-link to="/register">Register</router-link> here.</p>
        </form>
    </div>
</template>