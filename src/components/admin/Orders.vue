<script setup>
import { ref, onMounted } from 'vue';

const orders = ref([]);
const newOrder = ref({
    item: '',
    customer: '',
    contact_info: '',
    deadline: '',
    value: 0,
    status: 'pendente'
});

const fetchOrders = async () => {
    try {
        const res = await fetch('/api/orders', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } });
        orders.value = await res.json();
    } catch (e) {
        console.error("Error fetching orders", e);
    }
};

const addOrder = async () => {
    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') },
            body: JSON.stringify(newOrder.value)
        });
        const savedOrder = await res.json();
        orders.value.push(savedOrder);
        newOrder.value = { item: '', customer: '', contact_info: '', deadline: '', value: 0, status: 'pendente' };
    } catch (e) {
        console.error("Error adding order", e);
    }
};

onMounted(fetchOrders);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Gestão de Encomendas</h1>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-lg font-medium text-gray-900">Nova Encomenda</h2>
                <form @submit.prevent="addOrder" class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    
                    <div class="md:col-span-2 lg:col-span-1">
                        <label class="block text-sm font-medium text-gray-700">O que é a peça?</label>
                        <input type="text" v-model="newOrder.item" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Ex: Amigurumi Urso" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Pra quem? (Cliente)</label>
                        <input type="text" v-model="newOrder.customer" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Nome do cliente" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Contato (WhatsApp/Insta)</label>
                        <input type="text" v-model="newOrder.contact_info" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="(11) 9999-9999" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Prazo de Entrega</label>
                        <input type="date" v-model="newOrder.deadline" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Valor Cobrado (R$)</label>
                        <input type="number" step="0.01" v-model="newOrder.value" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>

                    <div class="lg:col-span-3 flex justify-end">
                        <button type="submit" class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-8 rounded-md transition-colors">
                            Cadastrar Encomenda
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peça</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prazo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="order in orders" :key="order.id">
                            <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ order.item }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ order.customer }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ order.contact_info }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ new Date(order.deadline).toLocaleDateString('pt-BR') }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                R$ {{ Number(order.value).toFixed(2) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span :class="['px-2 inline-flex text-xs leading-5 font-semibold rounded-full', 
                                    order.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                                    order.status === 'em andamento' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-green-100 text-green-800']">
                                    {{ order.status }}
                                </span>
                            </td>
                        </tr>
                        <tr v-if="orders.length === 0">
                            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Nenhuma encomenda registrada.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

