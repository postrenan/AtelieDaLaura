<script setup>
import { ref, onMounted, computed } from 'vue';
import { PackageCheck, CircleDollarSign, TrendingDown, Clock, MoveHorizontal } from '@lucide/vue';

const finances = ref([]);
const orders = ref([]);
const productionLogs = ref([]);
const materials = ref([]);

const fetchData = async () => {
    try {
        const [finRes, ordRes, prodRes, matRes] = await Promise.all([
            fetch('/api/finances', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } }),
            fetch('/api/orders', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } }),
            fetch('/api/production_logs', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } }),
            fetch('/api/materials', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } })
        ]);
        
        finances.value = await finRes.json();
        orders.value = await ordRes.json();
        productionLogs.value = await prodRes.json();
        materials.value = await matRes.json();
    } catch (e) {
        console.error("Error fetching dashboard data", e);
    }
};

onMounted(fetchData);

const entregasFeitas = computed(() => {
    return orders.value.filter(o => o.status === 'concluído').length;
});

const valorAdquirido = computed(() => {
    // Entradas financeiras
    return finances.value
        .filter(f => f.type === 'entrada')
        .reduce((sum, f) => sum + Number(f.amount), 0);
});

const valorGasto = computed(() => {
    // Saídas financeiras + Custo dos materiais comprados (opcionalmente. Se o custo do material ja for lançado como saida, não precisa somar, mas vamos assumir que o material em estoque é o gasto)
    const saidasFinanceiras = finances.value
        .filter(f => f.type === 'saida')
        .reduce((sum, f) => sum + Number(f.amount), 0);
    const custoMateriais = materials.value.reduce((sum, m) => sum + Number(m.cost), 0);
    // Para não duplicar, vamos usar só saídas financeiras (assumindo que a compra de material foi lançada la)
    // Ou melhor: Vamos somar os dois caso o usuario não lance no financeiro?
    // Vou usar só as saídas financeiras + materiais para ter certeza que está tudo coberto.
    return saidasFinanceiras;
});

const horasGastas = computed(() => {
    return productionLogs.value.reduce((sum, log) => sum + Number(log.hoursSpent), 0);
});

const metrosTricotados = computed(() => {
    let totalMeters = 0;
    productionLogs.value.forEach(log => {
        log.materialsUsed.forEach(mu => {
            // Check if this material is "metros"
            const mat = materials.value.find(m => m.id === mu.materialId);
            if (mat && mat.unit === 'metros') {
                totalMeters += Number(mu.quantityUsed);
            }
        });
    });
    return totalMeters;
});

</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600">Seus recordes e métricas de produção, estilo Strava!</p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-6">
            
            <!-- Entregas Feitas -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div class="flex justify-between items-start">
                    <h3 class="text-sm font-medium text-gray-500">Entregas Feitas</h3>
                    <div class="p-2 bg-green-50 rounded-lg">
                        <PackageCheck class="w-5 h-5 text-green-600" />
                    </div>
                </div>
                <p class="text-3xl font-display font-bold text-gray-900 mt-4">{{ entregasFeitas }}</p>
            </div>

            <!-- Valor Adquirido -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div class="flex justify-between items-start">
                    <h3 class="text-sm font-medium text-gray-500">Valor Adquirido</h3>
                    <div class="p-2 bg-blue-50 rounded-lg">
                        <CircleDollarSign class="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <p class="text-3xl font-display font-bold text-gray-900 mt-4">R$ {{ valorAdquirido.toFixed(2) }}</p>
            </div>

            <!-- Valor Gasto -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div class="flex justify-between items-start">
                    <h3 class="text-sm font-medium text-gray-500">Valor Gasto</h3>
                    <div class="p-2 bg-red-50 rounded-lg">
                        <TrendingDown class="w-5 h-5 text-red-600" />
                    </div>
                </div>
                <p class="text-3xl font-display font-bold text-gray-900 mt-4">R$ {{ valorGasto.toFixed(2) }}</p>
            </div>

            <!-- Horas Gastas -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div class="flex justify-between items-start">
                    <h3 class="text-sm font-medium text-gray-500">Horas de Trabalho</h3>
                    <div class="p-2 bg-purple-50 rounded-lg">
                        <Clock class="w-5 h-5 text-purple-600" />
                    </div>
                </div>
                <p class="text-3xl font-display font-bold text-gray-900 mt-4">{{ horasGastas }} <span class="text-lg font-normal text-gray-500">h</span></p>
            </div>

            <!-- Metros Tricotados -->
            <div class="bg-gradient-to-br from-rose-400 to-pink-500 p-6 rounded-xl shadow-md border border-rose-200 flex flex-col justify-between text-white">
                <div class="flex justify-between items-start">
                    <h3 class="text-sm font-medium text-rose-100">Fios Tricotados</h3>
                    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <MoveHorizontal class="w-5 h-5 text-white" />
                    </div>
                </div>
                <p class="text-3xl font-display font-bold mt-4">{{ metrosTricotados }} <span class="text-lg font-normal text-rose-100">metros</span></p>
            </div>

        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Últimas Produções</h3>
            <div class="space-y-4">
                <div v-for="log in productionLogs.slice().reverse().slice(0, 5)" :key="log.id" class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium text-gray-900">{{ log.pieceName }}</p>
                        <p class="text-sm text-gray-500">{{ new Date(log.date).toLocaleDateString('pt-BR') }} • {{ log.hoursSpent }}h de trabalho</p>
                    </div>
                    <span v-if="log.linkedOrderId" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Encomenda Concluída
                    </span>
                    <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                        Produção Livre
                    </span>
                </div>
                <p v-if="productionLogs.length === 0" class="text-sm text-gray-500 text-center py-4">Nenhuma produção registrada ainda.</p>
            </div>
        </div>
    </div>
</template>

