<script setup>
import { supabase } from '@/services/supabase';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const isEditMode = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
    'title': '',
    'status': '',
    'note': '',
})

const fetchCategory = async (id) => {
    try {
        loading.value = true
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single()
        if (error) throw error
        if (data) {
            form.title = data.title || ''
            form.status = data.status || 'ပေါင်းရန်'
            form.note = data.note || ''
        }
    } catch (error) {
        errorMessage.value = 'Failed to load Category: ' + error.message
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    const categoryId = route.params.id
    if (categoryId) {
        isEditMode.value = true
        fetchCategory(categoryId)
    }
})

const handleCreateOrUpdateCategory = async () => {
    try {
        loading.value = true
        errorMessage.value = ''
        if (isEditMode.value) {
            const categoryId = route.params.id
            const { error } = await supabase
                .from('categories')
                .update({
                    title: form.title,
                    status: form.status,
                    note: form.note,
                })
                .eq('id', categoryId)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from('categories')
                .insert([
                    {
                        title: form.title,
                        status: form.status,
                        note: form.note
                    }
                ])
            if (error) throw error
        }
        router.push('/categories')
    } catch (error) {
        errorMessage.value = error.message
    } finally {
        loading.value = false
    }
}

</script>
<template>
    <h1>{{ isEditMode ? 'Edit Your Category' : 'Let\'s add new Category' }}</h1>
    <p v-if="loading">Loading ...</p>
    <form @submit.prevent="handleCreateOrUpdateCategory">
        <span class="error">{{ errorMessage }}</span>
        <input type="text" name="title" id="title" placeholder="Title" v-model="form.title" required>
        <label for="sum">
            <input type="radio" name="status" id="sum" value="ပေါင်းရန်" v-model="form.status">ပေါင်းရန်
        </label>
        <label for="sub">
            <input type="radio" name="status" id="sub" value="နှုတ်ရန်" v-model="form.status">နှုတ်ရန်
        </label>
        <input type="text" name="note" id="note" placeholder="Note" v-model="form.note">
        <button class="btn-submit">
            {{ isEditMode ? 'Update' : 'Submit' }}
        </button>
    </form>
</template>