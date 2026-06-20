<script setup>
import { ref, onMounted } from 'vue';
import { Pencil, Trash2, Check } from '@lucide/vue';

const stock = ref([]);
const newItem = ref({ name: '', quantity: 1, cost: 0, price: 0 });
const editingId = ref(null);
const editForm = ref({});

const fetchStock = async () => {
    try {
        const res = await fetch('/api/stock', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') } });
        const data = await res.json();
        stock.value = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('Error fetching stock', e);
    }
};

const addItem = async () => {
    try {
        const res = await fetch('/api/stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify(newItem.value)
        });
        const saved = await res.json();
        stock.value.push(saved);
        newItem.value = { name: '', quantity: 1, cost: 0, price: 0 };
    } catch (e) {
        console.error('Error adding stock item', e);
    }
};

const startEdit = (item) => {
    editingId.value = item.id;
    editForm.value = { ...item };
};

const cancelEdit = () => {
    editingId.value = null;
    editForm.value = {};
};

const saveEdit = async (id) => {
    try {
        const res = await fetch(`/api/stock/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify(editForm.value)
        });
        const updated = await res.json();
        const idx = stock.value.findIndex(s => s.id === id);
        if (idx !== -1) stock.value[idx] = updated;
        cancelEdit();
    } catch (e) {
        console.error('Error updating stock item', e);
    }
};

const deleteItem = async (id) => {
    if (!confirm('Excluir este item do estoque?')) return;
    try {
        await fetch(`/api/stock/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') }
        });
        stock.value = stock.value.filter(s => s.id !== id);
    } catch (e) {
        console.error('Error deleting stock item', e);
    }
};

onMounted(fetchStock);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Estoque de Produtos (Pronta Entrega)</h1>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Adicionar Produto ao Estoque</h2>
                <form @submit.prevent="addItem" class="flex flex-wrap gap-4 items-end">
                    <div class="flex-2 min-w-[200px]">
                        <label for="stk-name" class="block text-sm font-medium text-gray-700">Nome da Peça</label>
                        <input id="stk-name" type="text" v-model="newItem.name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Ex: Touca de Lã Azul" />
                    </div>
                    <div class="flex-1 min-w-[120px]">
                        <label for="stk-qty" class="block text-sm font-medium text-gray-700">Quantidade</label>
                        <input id="stk-qty" type="number" v-model="newItem.quantity" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <div class="flex-1 min-w-[130px]">
                        <label for="stk-cost" class="block text-sm font-medium text-gray-700">Custo Total (R$)</label>
                        <input id="stk-cost" type="number" step="0.01" v-model="newItem.cost" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Custo de produção" />
                    </div>
                    <div class="flex-1 min-w-[130px]">
                        <label for="stk-price" class="block text-sm font-medium text-gray-700">Preço de Venda (R$)</label>
                        <input id="stk-price" type="number" step="0.01" v-model="newItem.price" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
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
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Un.</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Un.</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro Est.</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <template v-for="item in stock" :key="item.id">
                            <!-- Edit row -->
                            <tr v-if="editingId === item.id" class="bg-amber-50">
                                <td class="px-4 py-2">
                                    <input v-model="editForm.name" class="w-full rounded border border-gray-300 p-1.5 text-sm focus:border-amber-400 focus:outline-none" />
                                </td>
                                <td class="px-4 py-2">
                                    <input v-model="editForm.quantity" type="number" class="w-20 rounded border border-gray-300 p-1.5 text-sm focus:border-amber-400 focus:outline-none" />
                                </td>
                                <td class="px-4 py-2">
                                    <input v-model="editForm.cost" type="number" step="0.01" class="w-24 rounded border border-gray-300 p-1.5 text-sm focus:border-amber-400 focus:outline-none" />
                                </td>
                                <td class="px-4 py-2">
                                    <input v-model="editForm.price" type="number" step="0.01" class="w-24 rounded border border-gray-300 p-1.5 text-sm focus:border-amber-400 focus:outline-none" />
                                </td>
                                <td class="px-4 py-2 text-sm text-gray-400">—</td>
                                <td class="px-4 py-2 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button @click="saveEdit(item.id)" class="flex items-center gap-1 text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                                            <Check class="w-3 h-3" /> Salvar
                                        </button>
                                        <button @click="cancelEdit" class="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                            Cancelar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <!-- Display row -->
                            <tr v-else class="hover:bg-gray-50">
                                <td class="px-4 py-4 text-sm font-medium text-gray-900">{{ item.name }}</td>
                                <td class="px-4 py-4 text-sm text-gray-500">{{ item.quantity }}</td>
                                <td class="px-4 py-4 text-sm text-gray-500">R$ {{ Number(item.cost).toFixed(2) }}</td>
                                <td class="px-4 py-4 text-sm text-gray-900">R$ {{ Number(item.price).toFixed(2) }}</td>
                                <td class="px-4 py-4 text-sm font-medium" :class="(Number(item.price) - Number(item.cost)) >= 0 ? 'text-green-600' : 'text-red-500'">
                                    R$ {{ (Number(item.price) - Number(item.cost)).toFixed(2) }}
                                </td>
                                <td class="px-4 py-4 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button @click="startEdit(item)" class="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1 rounded hover:bg-amber-50 transition-colors">
                                            <Pencil class="w-3 h-3" /> Editar
                                        </button>
                                        <button @click="deleteItem(item.id)" class="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                            <Trash2 class="w-3 h-3" /> Excluir
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <tr v-if="stock.length === 0">
                            <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500">Nenhum produto no estoque.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
