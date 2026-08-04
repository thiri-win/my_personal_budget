<script setup>
import { supabase } from '@/services/supabase';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';


const route = useRoute()
const router = useRouter()

const isEditMode = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const categories = ref([])

const form = reactive({
    'date': new Date().toISOString().slice(0, 10),
    'description': '',
    'category_id': '',
    'amount': '',
    'note': '',
})

const fetchCategory = async () => {
    try {
        loading.value = true;
        errorMessage.value = '';
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('id', { ascending: true })
        if (error) throw error
        categories.value = data
    } catch (error) {
        errorMessage.value = error.message
    } finally {
        loading.value = false
    }
}

const fetchItem = async (id) => {
    try {
        loading.value = true
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', id)
            .single()
        if (error) throw error
        if (data) {
            form.date = data.date || ''
            form.description = data.description || ''
            form.category_id = data.category_id
            form.amount = data.amount
            form.note = data.note
        }
    } catch (error) {
        errorMessage.value = 'Failed to load Item: ' + error.message
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchCategory()
    const itemId = route.params.id
    if (itemId) {
        isEditMode.value = true
        fetchItem(itemId)
    }
})

const handleCreateOrUpdateItem = async () => {
    try {
        loading.value = true
        errorMessage.value = ''
        if (isEditMode.value) {
            const itemId = route.params.id
            const { error } = await supabase
                .from('items')
                .update({
                    date: form.date,
                    description: form.description,
                    category_id: form.category_id,
                    amount: form.amount,
                    note: form.note
                })
                .eq('id', itemId)
        } else {
            const { error } = await supabase
                .from('items')
                .insert([
                    {
                        date: form.date,
                        description: form.description,
                        category_id: form.category_id,
                        amount: form.amount,
                        note: form.note
                    }
                ])
            if (error) throw error
        }
        router.push('/items')
    } catch (error) {
        errorMessage.value = error.message
    } finally {
        loading.value = false
    }
}

</script>

<template>
    <h1>{{ isEditMode ? 'စာရင်းပြင်မယ်' : 'စာရင်းအသစ်ထည့်မယ်' }}</h1>
    <p v-if="loading">Loading ...</p>
    <form @submit.prevent="handleCreateOrUpdateItem">
        <span class="error">{{ errorMessage }}</span>
        <input type="date" name="date" id="date" placeholder="date" v-model="form.date">
        <input type="text" name="description" id="description" placeholder="Description" v-model="form.description" required autofocus>
        <select name="category_id" id="category_id" v-model="form.category_id">
            <option value="">Select Category</option>
            <template v-for="category in categories">
                <option :value="category.id">{{ category.title }}</option>
            </template>
        </select>
        <input type="number" name="amount" id="amount" placeholder="Amount" v-model="form.amount">
        <input type="text" name="note" id="note" placeholder="note" v-model="form.note">
        <button class="btn-submit">
            {{ isEditMode ? 'Update' : 'Submit' }}
        </button>
    </form>
</template>