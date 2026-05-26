<script setup>
import { ref, onMounted, computed } from 'vue';

const materials = ref([]);
const orders = ref([]);
const productionLogs = ref([]);

const newLog = ref({
    pieceName: '',
    hoursSpent: 0,
    linkedOrderId: '',
    materialsUsed: []
});

const currentMaterial = ref({ materialId: '', quantityUsed: 0 });

const fetchData = async () => {
    try {
        const [matRes, ordRes, logRes] = await Promise.all([
            fetch('/api/materials', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } }),
            fetch('/api/orders', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } }),
            fetch('/api/production_logs', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } })
        ]);
        materials.value = await matRes.json();
        orders.value = await ordRes.json();
        productionLogs.value = await logRes.json();
    } catch (e) {
        console.error("Error fetching data", e);
    }
};

const addMaterialToLog = () => {
    if (currentMaterial.value.materialId && currentMaterial.value.quantityUsed > 0) {
        newLog.value.materialsUsed.push({ ...currentMaterial.value });
        currentMaterial.value = { materialId: '', quantityUsed: 0 };
    }
};

const removeMaterialFromLog = (index) => {
    newLog.value.materialsUsed.splice(index, 1);
};

const submitLog = async () => {
    try {
        const res = await fetch('/api/production_logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') },
            body: JSON.stringify(newLog.value)
        });
        const savedLog = await res.json();
        productionLogs.value.push(savedLog);
        
        // Update local orders if linked
        if (newLog.value.linkedOrderId) {
            const order = orders.value.find(o => o.id === newLog.value.linkedOrderId);
            if (order) order.status = 'concluído';
        }
        
        // Reset
        newLog.value = { pieceName: '', hoursSpent: 0, linkedOrderId: '', materialsUsed: [] };
        
        // Re-fetch materials to update inventory
        const matRes = await fetch('/api/materials', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } });
        materials.value = await matRes.json();
    } catch (e) {
        console.error("Error submitting log", e);
    }
};

onMounted(fetchData);

const pendingOrders = computed(() => {
    return orders.value.filter(o => o.status !== 'concluído');
});

const getMaterialName = (id) => {
    const mat = materials.value.find(m => m.id === id);
    return mat ? `${mat.name} (${mat.unit})` : 'Material desconhecido';
};
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Registro de Produção</h1>
        <p class="text-gray-600">Registre o que você produziu hoje para alimentar suas métricas.</p>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <form @submit.prevent="submitLog" class="space-y-6">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nome da Peça / Produção</label>
                            <input type="text" v-model="newLog.pieceName" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Ex: Ursinho Amigurumi" />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Horas Gastas</label>
                            <input type="number" step="0.5" v-model="newLog.hoursSpent" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Ex: 4.5" />
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Materiais Consumidos</label>
                        <div class="flex gap-4 items-end mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-gray-500">Material</label>
                                <select v-model="currentMaterial.materialId" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border bg-white">
                                    <option value="" disabled>Selecione um material</option>
                                    <option v-for="mat in materials" :key="mat.id" :value="mat.id">
                                        {{ mat.name }} (Estoque: {{ mat.quantity }} {{ mat.unit }})
                                    </option>
                                </select>
                            </div>
                            <div class="w-32">
                                <label class="block text-xs font-medium text-gray-500">Quantidade</label>
                                <input type="number" step="0.01" v-model="currentMaterial.quantityUsed" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border bg-white" />
                            </div>
                            <button type="button" @click="addMaterialToLog" class="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                                + Adicionar
                            </button>
                        </div>

                        <ul v-if="newLog.materialsUsed.length > 0" class="mt-2 divide-y divide-gray-200 border rounded-lg">
                            <li v-for="(mu, index) in newLog.materialsUsed" :key="index" class="p-3 flex justify-between items-center bg-white text-sm">
                                <span><span class="font-medium">{{ mu.quantityUsed }}</span> x {{ getMaterialName(mu.materialId) }}</span>
                                <button type="button" @click="removeMaterialFromLog(index)" class="text-red-500 hover:text-red-700 text-xs font-bold">Remover</button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Vincular a Encomenda (Opcional)</label>
                        <select v-model="newLog.linkedOrderId" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border">
                            <option value="">Nenhuma (Produção Livre / Pronta Entrega)</option>
                            <option v-for="order in pendingOrders" :key="order.id" :value="order.id">
                                {{ order.item }} - {{ order.customer }} (Pendente)
                            </option>
                        </select>
                        <p class="mt-1 text-xs text-gray-500">Ao vincular, a encomenda será automaticamente marcada como "Concluída".</p>
                    </div>

                    <div class="pt-4 border-t border-gray-100 flex justify-end">
                        <button type="submit" class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-sm">
                            Salvar Produção
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

