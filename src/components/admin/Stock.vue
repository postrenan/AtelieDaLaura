<script setup>
import { ref, onMounted } from 'vue';

const stock = ref([]);
const newItem = ref({
    name: '',
    quantity: 1,
    cost: 0,
    price: 0
});

const fetchStock = async () => {
    try {
        const res = await fetch('/api/stock', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } });
        stock.value = await res.json();
    } catch (e) {
        console.error("Error fetching stock", e);
    }
};

const addItem = async () => {
    try {
        const res = await fetch('/api/stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') },
            body: JSON.stringify(newItem.value)
        });
        const savedItem = await res.json();
        stock.value.push(savedItem);
        newItem.value = { name: '', quantity: 1, cost: 0, price: 0 };
    } catch (e) {
        console.error("Error adding item", e);
    }
};

onMounted(fetchStock);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Estoque de Produtos (Pronta Entrega)</h1>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-lg font-medium text-gray-900">Adicionar Produto</h2>
                <form @submit.prevent="addItem" class="mt-4 flex flex-wrap gap-4 items-end">
                    <div class="flex-2 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700">Nome da Peça</label>
                        <input type="text" v-model="newItem.name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Ex: Touca de Lã Azul" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Quantidade</label>
                        <input type="number" v-model="newItem.quantity" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Custo Total (R$)</label>
                        <input type="number" step="0.01" v-model="newItem.cost" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Custo para produzir" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Preço de Venda (R$)</label>
                        <input type="number" step="0.01" v-model="newItem.price" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
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
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Un.</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Un.</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro Estimado</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="item in stock" :key="item.id">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.quantity }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {{ Number(item.cost).toFixed(2) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {{ Number(item.price).toFixed(2) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                R$ {{ (Number(item.price) - Number(item.cost)).toFixed(2) }}
                            </td>
                        </tr>
                        <tr v-if="stock.length === 0">
                            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Nenhum produto no estoque.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

