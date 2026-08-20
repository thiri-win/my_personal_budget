<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const now = new Date()
const currentYear = now.getFullYear()
const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0')

const selectedYear = ref(currentYear)
const selectedMonth = ref(currentMonthStr)
const categorySums = ref({})
const totalBalance = ref(0)
const isLoading = ref(false)

const startYear = 2025
const availableYears = computed(() => {
    const years = []
    for (let y = currentYear; y >= startYear; y--) {
        years.push(y)
    }
    return years
})

const monthsList = [
    { name: 'ဇန်နဝါရီ (Jan)', value: '01' },
    { name: 'ဖေဖော်ဝါရီ (Feb)', value: '02' },
    { name: 'မတ် (Mar)', value: '03' },
    { name: 'ဧပြီ (Apr)', value: '04' },
    { name: 'မေ (May)', value: '05' },
    { name: 'ဇွန် (Jun)', value: '06' },
    { name: 'ဇူလိုင် (Jul)', value: '07' },
    { name: 'ဩဂုတ် (Aug)', value: '08' },
    { name: 'စက်တင်ဘာ (Sep)', value: '09' },
    { name: 'အောက်တိုဘာ (Oct)', value: '10' },
    { name: 'နိုဝင်ဘာ (Nov)', value: '11' },
    { name: 'ဒီဇင်ဘာ (Dec)', value: '12' }
]

const chartColors = [
    '#2563EB',
    '#16A34A',
    '#DC2626',
    '#D97706',
    '#9333EA',
    '#0891B2',
    '#DB2777',
    '#4D7C0F',
    '#4F46E5',
    '#4B5563',
]

const chartData = computed(() => {
    const labels = Object.keys(categorySums.value)
    const data = Object.values(categorySums.value)

    return {
        labels: labels,
        datasets: [{ backgroundColor: chartColors.slice(0, labels.length), data: data }]
    }
})

const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }

const calculateMonthlySum = async () => {
    isLoading.value = true

    try {
        const year = Number(selectedYear.value)
        const month = String(selectedMonth.value).padStart(2, '0')
        const monthNum = Number(month)

        const startDate = `${year}-${month}-01`
        const lastDayNum = new Date(year, monthNum, 0).getDate()
        const endDate = `${year}-${month}-${String(lastDayNum).padStart(2, '0')}`

        const { data: items, error } = await supabase
            .from('items')
            .select(`
        amount,
        date,
        categories ( title, status )
      `)
            .gte('date', startDate)
            .lte('date', endDate)

        if (error) throw error

        const sums = {}
        let balance = 0

        if (items && items.length > 0) {
            items.forEach(item => {
                const categoryName = item.categories?.title || 'Uncategorized'
                const categoryStatus = item.categories?.status
                const amount = Number(item.amount) || 0

                if (!sums[categoryName]) {
                    sums[categoryName] = 0
                }
                sums[categoryName] += amount

                if (categoryStatus === 'ပေါင်းရန်') {
                    balance += amount
                } else if (categoryStatus === 'နှုတ်ရန်') {
                    balance -= amount
                } else {
                    balance += amount
                }
            })
        }

        categorySums.value = sums
        totalBalance.value = balance
    } catch (error) {
        console.error('Data ရယူစဉ် အမှားဖြစ်ပေါ်ပါသည်:', error.message)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    calculateMonthlySum()
})

</script>

<template>
    <div>
        <div>
            <h2>လအလိုက် Category အလိုက် သုံးစွဲမှု စာရင်း</h2>
            <div class="flex items-center gap-3 flex-1">
                <select v-model="selectedYear" @change="calculateMonthlySum">
                    <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                </select>

                <select v-model="selectedMonth" @change="calculateMonthlySum">
                    <option v-for="m in monthsList" :key="m.value" :value="m.value">{{ m.name }}</option>
                </select>
            </div>
        </div>

        <div class="relative h-72 w-full flex justify-center items-center">
            <p v-if="isLoading" class="text-gray-400 animate-pulse">Data ရယူနေပါသည်...</p>
            <Doughnut v-else-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" :key="JSON.stringify(chartData)" />
            <p v-else class="text-gray-400 italic">ဒီလအတွက် ဒေတာ မရှိသေးပါခင်ဗျာ။</p>
        </div>
        <div class="w-full overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>စုစုပေါင်း (MMK)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(sum, category) in categorySums" :key="category" class="border-b hover:bg-gray-50">
                        <td>{{ category }}</td>
                        <td class="text-right!">{{ sum.toLocaleString() }}</td>
                    </tr>
                    <tr v-if="!isLoading && Object.keys(categorySums).length === 0">
                        <td colspan="2">ဒေတာ မရှိပါ။</td>
                    </tr>
                </tbody>

                <tfoot v-if="!isLoading && Object.keys(categorySums).length > 0">
                    <tr>
                        <td>လက်ကျန် စုစုပေါင်း (Net Balance)</td>
                        <td class="text-right!" :class="totalBalance >= 0 ? 'text-green-600' : 'text-red-600'">
                            {{ totalBalance.toLocaleString() }}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</template>