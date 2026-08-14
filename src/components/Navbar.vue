<script setup lang="ts">
import { supabase } from '@/services/supabase';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const loading = ref(false)
const user = ref(null)

onMounted(async () => {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user || null

    supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user || null
    })
})

const handleLogout = async () => {
    try {
        loading.value = true
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        router.push('/login')
    } catch (error) {
        alert(error.message)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <nav>
        <router-link to="/">
            <img src="/icon.png" alt="Logo" class="inline-block">
            <template v-if="user">
                <span>{{ user.user_metadata.display_name }}</span>
            </template>
        </router-link>
        <ul>
            <template v-if="user">
                <li>
                    <router-link to="/items">
                        <i class="fa-solid fa-list"></i>
                        <span class="hidden sm:inline-block">Item</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/categories">
                        <i class="fa-solid fa-grip"></i>
                        <span class="hidden sm:inline-block">Category</span>
                    </router-link>
                </li>
                <li>
                    <button @click="handleLogout">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                        <span class="hidden sm:inline-block">Logout</span>
                    </button>
                </li>
            </template>
            <template v-else>
                <li>
                    <router-link to="/register">
                        <i class="fa-solid fa-user"></i>
                        <span>Register</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/login">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        <span>Login</span>
                    </router-link>
                </li>
            </template>
        </ul>
    </nav>
</template>