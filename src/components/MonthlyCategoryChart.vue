<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const EXPENSE_STATUS = 'နှုတ်ရန်'
const UNCATEGORIZED = 'Uncategorized'
const START_YEAR = 2026
const COMPARE_MONTH_OFFSETS = [-2, -1, 0]

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

const now = new Date()
const currentYear = now.getFullYear()

const selectedYear = ref(currentYear)
const selectedMonth = ref(String(now.getMonth() + 1).padStart(2, '0'))
const categorySums = ref({})
const totalBalance = ref(0)
const monthColumns = ref([])
const categoryRows = ref([])
const monthBalances = ref({})
const isLoading = ref(false)

const availableYears = computed(() => {
    const years = []
    for (let year = currentYear; year >= START_YEAR; year--) {
        years.push(year)
    }
    return years
})

const hasCurrentMonthData = computed(() => Object.keys(categorySums.value).length > 0)
const hasComparisonData = computed(() => categoryRows.value.length > 0)

const currentMonthColumnTotal = computed(() => {
    return Object.values(categorySums.value).reduce((sum, amount) => sum + (Number(amount) || 0), 0)
})

const chartData = computed(() => {
    const labels = Object.keys(categorySums.value)

    return {
        labels,
        datasets: [{
            backgroundColor: chartColors.slice(0, labels.length),
            data: Object.values(categorySums.value)
        }]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
}

const padMonth = (value) => String(value).padStart(2, '0')

const monthKeyFromDate = (date) => String(date).slice(0, 7)

const signedAmount = (status, amount) => {
    return status === EXPENSE_STATUS ? -amount : amount
}

const formatAmount = (value) => Number(value || 0).toLocaleString()

const netBalanceClass = (value) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
}

const previousMonthKey = (monthIndex) => {
    if (monthIndex <= 0) return null
    return monthColumns.value[monthIndex - 1]?.key ?? null
}

const trendIconClass = (currentAmount, previousAmount, monthIndex) => {
    if (!previousMonthKey(monthIndex)) return ''
    const isDown = Number(currentAmount) < Number(previousAmount || 0)
    return isDown ? 'fa-solid fa-arrow-down text-red-500' : 'fa-solid fa-arrow-up text-green-500'
}

const getMonthMeta = (year, monthNum, offset) => {
    const date = new Date(year, monthNum - 1 + offset, 1)
    const monthYear = date.getFullYear()
    const month = padMonth(date.getMonth() + 1)
    const monthName = monthsList.find(item => item.value === month)?.name || month
    const lastDay = padMonth(new Date(monthYear, Number(month), 0).getDate())

    return {
        key: `${monthYear}-${month}`,
        label: `${monthName} ${monthYear}`,
        startDate: `${monthYear}-${month}-01`,
        endDate: `${monthYear}-${month}-${lastDay}`
    }
}

const getThreeMonthWindow = (year, monthNum) => {
    return COMPARE_MONTH_OFFSETS.map(offset => getMonthMeta(year, monthNum, offset))
}

const fetchItemsInRange = async (startDate, endDate) => {
    const { data, error } = await supabase
        .from('items')
        .select(`
            amount,
            date,
            categories ( title, status )
        `)
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) throw error
    return data || []
}

const aggregateByMonthAndCategory = (items, months) => {
    const sumsByMonth = {}
    const netsByMonth = {}

    months.forEach(month => {
        sumsByMonth[month.key] = {}
        netsByMonth[month.key] = 0
    })

    items.forEach(item => {
        const monthKey = monthKeyFromDate(item.date)
        if (!sumsByMonth[monthKey]) return

        const categoryName = item.categories?.title || UNCATEGORIZED
        const amount = Number(item.amount) || 0

        sumsByMonth[monthKey][categoryName] = (sumsByMonth[monthKey][categoryName] || 0) + amount
        netsByMonth[monthKey] += signedAmount(item.categories?.status, amount)
    })

    return { sumsByMonth, netsByMonth }
}

const collectCategoryNames = (months, sumsByMonth) => {
    return [...new Set(months.flatMap(month => Object.keys(sumsByMonth[month.key])))]
}

const sortCategoriesBySelectedMonth = (categoryNames, selectedSums) => {
    return [...categoryNames].sort((left, right) => {
        const amountDiff = (selectedSums[right] || 0) - (selectedSums[left] || 0)
        if (amountDiff !== 0) return amountDiff
        return left.localeCompare(right)
    })
}

const buildComparisonRows = (categoryNames, months, sumsByMonth) => {
    return categoryNames.map(category => ({
        category,
        amounts: Object.fromEntries(
            months.map(month => [month.key, sumsByMonth[month.key][category] || 0])
        )
    }))
}

const calculateMonthlySum = async () => {
    isLoading.value = true

    try {
        const months = getThreeMonthWindow(Number(selectedYear.value), Number(selectedMonth.value))
        const selectedMonthMeta = months[months.length - 1]
        const items = await fetchItemsInRange(months[0].startDate, selectedMonthMeta.endDate)
        const { sumsByMonth, netsByMonth } = aggregateByMonthAndCategory(items, months)
        const selectedSums = sumsByMonth[selectedMonthMeta.key]
        const categoryNames = sortCategoriesBySelectedMonth(
            collectCategoryNames(months, sumsByMonth),
            selectedSums
        )

        monthColumns.value = months
        categoryRows.value = buildComparisonRows(categoryNames, months, sumsByMonth)
        monthBalances.value = netsByMonth
        categorySums.value = selectedSums
        totalBalance.value = netsByMonth[selectedMonthMeta.key]
    } catch (error) {
        console.error('Data ရယူစဉ် အမှားဖြစ်ပေါ်ပါသည်:', error.message)
    } finally {
        isLoading.value = false
    }
}

onMounted(calculateMonthlySum)
</script>

<template>
    <div>
        <div class="flex items-center gap-3 flex-1">
            <select v-model="selectedYear" @change="calculateMonthlySum">
                <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
            <select v-model="selectedMonth" @change="calculateMonthlySum">
                <option v-for="month in monthsList" :key="month.value" :value="month.value">{{ month.name }}</option>
            </select>
        </div>

        <div class="relative h-72 w-full flex justify-center items-center">
            <p v-if="isLoading" class="text-gray-400 animate-pulse">Data ရယူနေပါသည်...</p>
            <Doughnut
                v-else-if="chartData.labels.length > 0"
                :data="chartData"
                :options="chartOptions"
                :key="JSON.stringify(chartData)"
            />
            <p v-else class="text-gray-400 italic">ဒီလအတွက် ဒေတာ မရှိသေးပါခင်ဗျာ။</p>
        </div>

        <div class="w-full overflow-x-auto">
            <h2>ယခုလအလိုက် Category အလိုက် သုံးစွဲမှု စာရင်း</h2>
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
                        <td class="text-right!">{{ formatAmount(sum) }}</td>
                    </tr>
                    <tr v-if="!isLoading && !hasCurrentMonthData">
                        <td colspan="2">ဒေတာ မရှိပါ။</td>
                    </tr>
                </tbody>
                <tfoot v-if="!isLoading && hasCurrentMonthData">
                    <tr>
                        <td>စုစုပေါင်း</td>
                        <td class="text-right!">{{ formatAmount(currentMonthColumnTotal) }}</td>
                    </tr>
                    <tr>
                        <td>လက်ကျန် စုစုပေါင်း (Net Balance)</td>
                        <td class="text-right!" :class="netBalanceClass(totalBalance)">
                            {{ formatAmount(totalBalance) }}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div class="w-full overflow-x-auto mt-8">
            <h2>၃ လစာ Category အလိုက် စုစုပေါင်း</h2>
            <table class="w-full">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th v-for="month in monthColumns" :key="month.key">{{ month.label }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in categoryRows" :key="row.category" class="border-b hover:bg-gray-50">
                        <td>{{ row.category }}</td>
                        <td
                            v-for="(month, monthIndex) in monthColumns"
                            :key="`${row.category}-${month.key}`"
                            class="text-right!"
                        >
                            <span class="inline-flex items-center justify-end gap-1">
                                {{ formatAmount(row.amounts[month.key]) }}
                                <i
                                    v-if="monthIndex > 0"
                                    :class="trendIconClass(row.amounts[month.key], row.amounts[monthColumns[monthIndex - 1].key], monthIndex)"
                                ></i>
                            </span>
                        </td>
                    </tr>
                    <tr v-if="!isLoading && !hasComparisonData">
                        <td :colspan="monthColumns.length + 1">ဒေတာ မရှိပါ။</td>
                    </tr>
                </tbody>
                <tfoot v-if="!isLoading && hasComparisonData">
                    <tr>
                        <td>လက်ကျန် စုစုပေါင်း (Net Balance)</td>
                        <td
                            v-for="(month, monthIndex) in monthColumns"
                            :key="`balance-${month.key}`"
                            class="text-right!"
                            :class="netBalanceClass(monthBalances[month.key])"
                        >
                            <span class="inline-flex items-center justify-end gap-1">
                                {{ formatAmount(monthBalances[month.key]) }}
                                <i
                                    v-if="monthIndex > 0"
                                    :class="trendIconClass(monthBalances[month.key], monthBalances[monthColumns[monthIndex - 1].key], monthIndex)"
                                ></i>
                            </span>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</template>
