<script setup>
import { supabase } from '@/services/supabase';
import { onMounted, ref } from 'vue';

const loading = ref(false)
const errorMessage = ref('')
const items = ref([])

const fetchItems = async () => {
    try {
        loading.value = true;
        errorMessage.value = '';
        const { data, error } = await supabase
            .from('items')
            .select('*, category:categories(title)')
            .order('id', { ascending: true })
        if (error) throw error
        items.value = data
    } catch (error) {
        errorMessage.value = error.message
    } finally {
        loading.value = false
    }
}

const handleDeleteItem = async (id) => {
    if (!confirm('ဖျက်မှာ သေချာပြီလား')) return;
    try {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id)
        if (error) throw error
        items.value = items.value.filter(item => item.id !== id)
    } catch (error) {
        alert('Delete failed: ' + error.message)
    }
}

onMounted(() => { fetchItems() })

</script>

<template>
    <router-link to="/items/create" class="btn-new">
        <i class="fa-solid fa-plus-circle"></i>
        New Item
    </router-link>
    <p v-if="loading" class="show-noti">Loading Items ... </p>
    <p v-if="!loading && !items.length" class="show-noti">No Items to display</p>
    <span class="error">{{ errorMessage }}</span>
    <div class="w-full overflow-x-auto">
        <table v-if="!loading && items.length">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in items">
                    <td>{{ item.id }}</td>
                    <td>{{ item.date }}</td>
                    <td>{{ item.description }}</td>
                    <td>{{ item.category.title }}</td>
                    <td>{{ item.amount }}</td>
                    <td>{{ item.note }}</td>
                    <td>
                        <router-link :to="`/items/edit/${item.id}`" class="btn-edit">
                            <i class="fa-solid fa-file-pen"></i>
                        </router-link>
                        <button @click="handleDeleteItem(item.id)" class="btn-delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>