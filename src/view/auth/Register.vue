<script setup>
import { supabase } from '@/services/supabase';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const errorMessage = ref('')
const loading = ref(false)
const form = reactive({
    name: '',
    email: '',
    password: '',
})

const handleRegister = async () => {
    try {
        loading.value = true
        errorMessage.value = ''
        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    display_name: form.name,
                }
            }
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
        <h1>Register</h1>
        <form @submit.prevent="handleRegister">
            <span class="error">{{ errorMessage }}</span>
            <input type="text" name="name" id="name" placeholder="Your Name" v-model="form.name" required autofocus>
            <input type="email" name="email" id="email" placeholder="Your Email" v-model="form.email" required>
            <input type="password" name="password" id="password" placeholder="Your Password" v-model="form.password" required>
            <button class="btn-submit">
                {{ loading ? 'Registering ... ' : 'Register' }}
            </button>
        </form>
    </div>
</template>