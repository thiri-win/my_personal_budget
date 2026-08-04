<script setup>
import { supabase } from '@/services/supabase';
import { onMounted, ref } from 'vue';

const categories = ref([])
const loading = ref(true)
const errorMessage = ref('')

const fetchCategories = async () => {
    try {
        loading.value = true
        errorMessage.value = ''
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

const handleDeleteCategory = async (id) => {
    if (!confirm('ဖျက်မှာ သေချာလား')) return

    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) throw error
        categories.value = categories.value.filter(cat => cat.id !== id)
    } catch (error) {
        alert('Delete failed: ' + error.message)
    }
}

onMounted(() => { fetchCategories() })

</script>

<template>
    <router-link to="/categories/create" class="btn-new">
        <i class="fa-solid fa-plus-circle"></i>
        New Category
    </router-link>
    <p v-if="loading" class="show-noti">Loading Categories ... </p>
    <p v-if="!loading && !categories.length" class="show-noti">No Categories to display</p>
    <span class="error">{{ errorMessage }}</span>
    <div class="w-full overflow-x-auto">
        <table v-if="!loading && categories.length">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Note</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="category in categories">
                    <td>{{ category.id }}</td>
                    <td>{{ category.title }}</td>
                    <td>{{ category.status }}</td>
                    <td>{{ category.note }}</td>
                    <td>
                        <router-link :to="`/categories/edit/${category.id}`" class="btn-edit">
                            <i class="fa-solid fa-file-pen"></i>
                        </router-link>
                        <button @click="handleDeleteCategory(category.id)" class="btn-delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>