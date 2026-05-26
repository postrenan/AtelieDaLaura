<script setup>
import { ref, onMounted, computed } from 'vue';

const entries = ref([]);
const newEntry = ref({
    type: 'entrada',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
});

const fetchFinances = async () => {
    try {
        const res = await fetch('/api/finances', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } });
        entries.value = await res.json();
    } catch (e) {
        console.error("Error fetching finances", e);
    }
};

const addEntry = async () => {
    try {
        const res = await fetch('/api/finances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') },
            body: JSON.stringify(newEntry.value)
        });
        const savedEntry = await res.json();
        entries.value.push(savedEntry);
        newEntry.value = { type: 'entrada', description: '', amount: 0, date: new Date().toISOString().split('T')[0] };
    } catch (e) {
        console.error("Error adding entry", e);
    }
};

const balance = computed(() => {
    return entries.value.reduce((acc, entry) => {
        return entry.type === 'entrada' ? acc + Number(entry.amount) : acc - Number(entry.amount);
    }, 0);
});

onMounted(fetchFinances);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Controle Financeiro</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-sm font-medium text-gray-500">Saldo Atual</h3>
                <p :class="['text-3xl font-bold mt-2', balance >= 0 ? 'text-green-600' : 'text-red-600']">
                    R$ {{ balance.toFixed(2) }}
                </p>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-lg font-medium text-gray-900">Nova Transação</h2>
                <form @submit.prevent="addEntry" class="mt-4 flex flex-wrap gap-4 items-end">
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Tipo</label>
                        <select v-model="newEntry.type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border">
                            <option value="entrada">Entrada</option>
                            <option value="saida">Saída</option>
                        </select>
                    </div>
                    <div class="flex-2 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700">Descrição</label>
                        <input type="text" v-model="newEntry.description" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Valor (R$)</label>
                        <input type="number" step="0.01" v-model="newEntry.amount" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" v-model="newEntry.date" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <button type="submit" class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-md transition-colors">
                        Adicionar
                    </button>
                </form>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="entry in entries" :key="entry.id">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ new Date(entry.date).toLocaleDateString('pt-BR') }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ entry.description }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span :class="['px-2 inline-flex text-xs leading-5 font-semibold rounded-full', entry.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                                    {{ entry.type === 'entrada' ? 'Entrada' : 'Saída' }}
                                </span>
                            </td>
                            <td :class="['px-6 py-4 whitespace-nowrap text-sm text-right font-medium', entry.type === 'entrada' ? 'text-green-600' : 'text-red-600']">
                                R$ {{ Number(entry.amount).toFixed(2) }}
                            </td>
                        </tr>
                        <tr v-if="entries.length === 0">
                            <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">Nenhuma transação registrada.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

