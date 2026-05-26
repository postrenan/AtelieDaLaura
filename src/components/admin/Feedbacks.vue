<script setup>
import { ref, onMounted } from 'vue';

const feedbacks = ref([]);
const newFeedback = ref({
    customerName: '',
    productName: '',
    comment: ''
});

const fetchFeedbacks = async () => {
    try {
        const res = await fetch('/api/feedbacks', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') } });
        feedbacks.value = await res.json();
    } catch (e) {
        console.error("Error fetching feedbacks", e);
    }
};

const addFeedback = async () => {
    try {
        const res = await fetch('/api/feedbacks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('atelie_token') },
            body: JSON.stringify(newFeedback.value)
        });
        const savedFeedback = await res.json();
        feedbacks.value.push(savedFeedback);
        newFeedback.value = { customerName: '', productName: '', comment: '' };
    } catch (e) {
        console.error("Error adding feedback", e);
    }
};

onMounted(fetchFeedbacks);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Avaliações (Feedbacks)</h1>
        <p class="text-gray-600">Registre o que seus clientes disseram sobre as suas peças. Eles aparecerão no site público!</p>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-lg font-medium text-gray-900">Novo Depoimento</h2>
                <form @submit.prevent="addFeedback" class="mt-4 flex flex-col gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nome do Cliente</label>
                            <input type="text" v-model="newFeedback.customerName" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Ex: Maria Silva" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Peça Comprada</label>
                            <input type="text" v-model="newFeedback.productName" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Ex: Touca de Lã Azul" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Comentário / Depoimento</label>
                        <textarea v-model="newFeedback.comment" required rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="O que o cliente disse sobre a peça?"></textarea>
                    </div>
                    
                    <div class="flex justify-end mt-2">
                        <button type="submit" class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-8 rounded-md transition-colors shadow-sm">
                            Adicionar ao Site
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="p-6 bg-gray-50">
                <h3 class="text-md font-medium text-gray-900 mb-4">Feedbacks Cadastrados</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="feedback in feedbacks" :key="feedback.id" class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
                        <p class="italic text-gray-600 text-sm mb-4">"{{ feedback.comment }}"</p>
                        <div class="mt-auto border-t pt-3 flex items-center justify-between">
                            <div>
                                <p class="font-bold text-gray-900 text-sm">{{ feedback.customerName }}</p>
                                <p class="text-xs text-rose-500 font-medium">{{ feedback.productName }}</p>
                            </div>
                        </div>
                    </div>
                    <p v-if="feedbacks.length === 0" class="text-sm text-gray-500 col-span-full">Nenhum feedback cadastrado ainda.</p>
                </div>
            </div>
        </div>
    </div>
</template>

