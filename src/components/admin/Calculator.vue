<script setup>
import { ref, computed } from 'vue';

const materialCost = ref(0);
const hoursSpent = ref(0);
const hourlyRate = ref(15); // Default R$ 15/h
const profitMargin = ref(30); // Default 30% margin

const totalCost = computed(() => {
    return Number(materialCost.value) + (Number(hoursSpent.value) * Number(hourlyRate.value));
});

const suggestedPrice = computed(() => {
    return totalCost.value * (1 + Number(profitMargin.value) / 100);
});

const profitAmount = computed(() => {
    return suggestedPrice.value - totalCost.value;
});
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Calculadora de Precificação</h1>
        <p class="text-gray-600">Preencha os campos abaixo para descobrir o preço de venda ideal para as suas criações.</p>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            
            <!-- Formulário -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Custo Total de Materiais Utilizados (R$)</label>
                    <input type="number" step="0.01" v-model="materialCost" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-lg p-3 border" placeholder="Ex: 25.50" />
                    <p class="mt-1 text-xs text-gray-500">Some o custo dos fios, botões, enchimento, embalagem, etc.</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Horas Gastas na Produção</label>
                    <input type="number" step="0.5" v-model="hoursSpent" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-lg p-3 border" placeholder="Ex: 4" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Valor da sua Hora de Trabalho (R$)</label>
                    <input type="number" step="0.5" v-model="hourlyRate" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-lg p-3 border" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Margem de Lucro Desejada (%)</label>
                    <input type="number" v-model="profitMargin" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-lg p-3 border" />
                    <p class="mt-1 text-xs text-gray-500">Este valor é para o crescimento do seu ateliê, além da sua hora trabalhada.</p>
                </div>
            </div>

            <!-- Resultado -->
            <div class="space-y-6">
                <div class="bg-gradient-to-br from-rose-50 to-pink-100 p-8 rounded-xl shadow-sm border border-rose-200 text-center">
                    <h3 class="text-rose-800 font-medium mb-2">Preço de Venda Sugerido</h3>
                    <div class="text-5xl font-display font-bold text-rose-600">
                        R$ {{ suggestedPrice.toFixed(2) }}
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h4 class="font-medium text-gray-900 border-b pb-2 mb-4">Resumo dos Custos</h4>
                    <ul class="space-y-3">
                        <li class="flex justify-between text-sm">
                            <span class="text-gray-600">Materiais:</span>
                            <span class="font-medium text-gray-900">R$ {{ Number(materialCost).toFixed(2) }}</span>
                        </li>
                        <li class="flex justify-between text-sm">
                            <span class="text-gray-600">Mão de Obra ({{ hoursSpent }}h x R${{ hourlyRate }}):</span>
                            <span class="font-medium text-gray-900">R$ {{ (Number(hoursSpent) * Number(hourlyRate)).toFixed(2) }}</span>
                        </li>
                        <li class="flex justify-between text-sm font-bold border-t pt-2">
                            <span class="text-gray-800">Custo Total de Produção:</span>
                            <span class="text-gray-900">R$ {{ totalCost.toFixed(2) }}</span>
                        </li>
                        <li class="flex justify-between text-sm text-green-600 font-medium mt-2">
                            <span>Lucro do Ateliê ({{ profitMargin }}%):</span>
                            <span>+ R$ {{ profitAmount.toFixed(2) }}</span>
                        </li>
                    </ul>
                </div>
            </div>
            
        </div>
    </div>
</template>

