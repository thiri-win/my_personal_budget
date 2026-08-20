<script setup>
import { supabase } from '@/services/supabase';
import { isVNode, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const category = ref(null);
const categoryItems = ref(null);


const fetchCategory = async (id) => {
    try {
        loading.value = true

        const { data, error } = await supabase
            .from('categories')
            .select('*, items(*)')
            .eq('id', id)
            .single()

        if (error) throw error

        if (data) {
            const groupedByMonth = data.items.reduce((acc, item) => {
                const monthKey = item.date.slice(0, 7)
                const amount = Number(item.amount) || 0
                if (!acc[monthKey]) {
                    acc[monthKey] = {
                        month: monthKey,
                        totalAmount: 0,
                        itemsCount: 0,
                        itemsList: [],
                    }
                }
                acc[monthKey].totalAmount += amount
                acc[monthKey].itemsCount += 1
                acc[monthKey].itemsList.push(item)
                return acc
            }, {})

            const sortedMonthlyData = Object.values(groupedByMonth).sort((a, b) => b.month.localeCompare(a.month))

            category.value = data
            categoryItems.value = sortedMonthlyData
        }

    } catch (error) {
        console.log("Error fetching data:", error);
        errorMessage.value = error.message || 'ဒေတာ ရယူစဥ် အမှားဖြစ်ပေါ်နေသည်';
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    const categoryId = route.params.id
    fetchCategory(categoryId)
})

</script>
<template>
    <div>
        <span v-if="loading" class="show-noti">loading ... </span>
        <span>{{ errorMessage }}</span>

        <h1>{{ category?.title }}</h1>
        <div v-for="item in categoryItems" id="item.month">
            <h2>{{ item.month }}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in item.itemsList">
                        <td>{{ item.date }}</td>
                        <td>{{ item.description }}</td>
                        <td class="text-right!">{{ item.amount.toLocaleString() }}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td class="text-right" colspan="2">Total</td>
                        <td class="text-right!">{{ item.totalAmount.toLocaleString() }}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</template>