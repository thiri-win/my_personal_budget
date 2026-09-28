<script setup>
import { supabase } from '@/services/supabase';
import { computed, onMounted, ref } from 'vue';

const loading = ref(false)
const errorMessage = ref('')
const items = ref([])
const startDate = ref('')
const endDate = ref('')
const currentPage = ref(1)
const pageSize = 10
const totalItems = ref(0)

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

const getCurrentMonthDates = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()

    return {
        start: `${year}-${month}-01`,
        end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    }
}

const fetchItems = async () => {
    try {
        loading.value = true;
        errorMessage.value = '';
        let query = supabase
            .from('items')
            .select('*, category:categories(title, status)', { count: 'exact' })

        const hasDateFilter = startDate.value || endDate.value
        const dates = hasDateFilter
            ? { start: startDate.value, end: endDate.value }
            : getCurrentMonthDates()

        if (dates.start) query = query.gte('date', dates.start)
        if (dates.end) query = query.lte('date', dates.end)

        const from = (currentPage.value - 1) * pageSize
        const to = from + pageSize - 1
        const { data, count, error } = await query
            .order('date', { ascending: false })
            .order('id', { ascending: false })
            .range(from, to)
        if (error) throw error
        items.value = data || []
        totalItems.value = count || 0
    } catch (error) {
        errorMessage.value = error.message
    } finally {
        loading.value = false
    }
}

const applyDateFilter = () => {
    if (startDate.value && endDate.value && startDate.value > endDate.value) {
        errorMessage.value = 'Start date must be before or equal to end date.'
        return
    }
    currentPage.value = 1
    fetchItems()
}

const clearDateFilter = () => {
    startDate.value = ''
    endDate.value = ''
    currentPage.value = 1
    fetchItems()
}

const changePage = (page) => {
    if (page < 1 || page > totalPages.value || page === currentPage.value) return
    currentPage.value = page
    fetchItems()
}

const handleDeleteItem = async (id) => {
    if (!confirm('ဖျက်မှာ သေချာပြီလား')) return;
    try {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id)
        if (error) throw error
        if (items.value.length === 1 && currentPage.value > 1) {
            currentPage.value -= 1
        }
        fetchItems()
    } catch (error) {
        alert('Delete failed: ' + error.message)
    }
}

onMounted(() => { fetchItems() })

</script>

<template>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <router-link to="/items/create" class="btn-new mb-0">
            <i class="fa-solid fa-plus-circle"></i>
            New Item
        </router-link>
        <form class="date-filter" @submit.prevent="applyDateFilter">
            <label>
                Start date
                <input type="date" v-model="startDate">
            </label>
            <label>
                End date
                <input type="date" v-model="endDate">
            </label>
            <button type="submit" class="btn-filter">Filter</button>
            <button type="button" class="btn-clear" @click="clearDateFilter">Clear</button>
        </form>
    </div>
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
                    <td>{{ item.category?.title || '-' }}</td>
                    <td class="text-right" :class="item.category?.status == 'ပေါင်းရန်' ? 'text-green-500': 'text-red-500'">
                        {{ item.amount.toLocaleString() }}
                    </td>
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
    <div v-if="totalPages > 1" class="pagination">
        <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
            Previous
        </button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
            Next
        </button>
    </div>
</template>
