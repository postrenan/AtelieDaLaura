<script setup>
import { ref, onMounted, computed } from 'vue';

const materials = ref([]);
const newMaterial = ref({
    name: '',
    cost: 0,
    unit: 'unidade',
    quantity: 1
});

const fetchMaterials = async () => {
    try {
        const res = await fetch('/api/materials', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } });
        materials.value = await res.json();
    } catch (e) {
        console.error("Error fetching materials", e);
    }
};

const addMaterial = async () => {
    try {
        const res = await fetch('/api/materials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') },
            body: JSON.stringify(newMaterial.value)
        });
        const savedMaterial = await res.json();
        materials.value.push(savedMaterial);
        newMaterial.value = { name: '', cost: 0, unit: 'unidade', quantity: 1 };
    } catch (e) {
        console.error("Error adding material", e);
    }
};

onMounted(fetchMaterials);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Estoque e Produção</h1>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-lg font-medium text-gray-900">Novo Material</h2>
                <form @submit.prevent="addMaterial" class="mt-4 flex flex-wrap gap-4 items-end">
                    <div class="flex-2 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700">Nome do Material (Fio, botão, etc)</label>
                        <input type="text" v-model="newMaterial.name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Custo Total (R$)</label>
                        <input type="number" step="0.01" v-model="newMaterial.cost" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Unidade</label>
                        <select v-model="newMaterial.unit" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border">
                            <option value="unidade">Unidade(s)</option>
                            <option value="metros">Metros</option>
                            <option value="gramas">Gramas</option>
                            <option value="novelo">Novelo(s)</option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label class="block text-sm font-medium text-gray-700">Quantidade Comprada</label>
                        <input type="number" step="0.01" v-model="newMaterial.quantity" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
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
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo por Unidade</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="mat in materials" :key="mat.id">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ mat.name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {{ Number(mat.cost).toFixed(2) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ mat.quantity }} {{ mat.unit }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                R$ {{ (Number(mat.cost) / Number(mat.quantity)).toFixed(2) }} / {{ mat.unit === 'metros' || mat.unit === 'gramas' ? '1' : mat.unit }}
                            </td>
                        </tr>
                        <tr v-if="materials.length === 0">
                            <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">Nenhum material registrado.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

