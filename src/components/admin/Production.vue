<script setup>
import { ref, onMounted } from 'vue';
import { Camera, Loader, Sparkles, X } from '@lucide/vue';

const materials = ref([]);
const newMaterial = ref({
    name: '',
    cost: 0,
    unit: 'novelo',
    quantity: 1
});

const scanner = ref({
    open: false,
    loading: false,
    preview: null
});

const fetchMaterials = async () => {
    try {
        const res = await fetch('/api/materials', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') } });
        const data = await res.json();
        materials.value = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Error fetching materials", e);
    }
};

const addMaterial = async () => {
    try {
        const res = await fetch('/api/materials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify(newMaterial.value)
        });
        const savedMaterial = await res.json();
        materials.value.push(savedMaterial);
        newMaterial.value = { name: '', cost: 0, unit: 'novelo', quantity: 1 };
    } catch (e) {
        console.error("Error adding material", e);
    }
};

const compressImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 1024;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
                    else { width = Math.round((width * MAX) / height); height = MAX; }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
                resolve(base64);
            };
        };
    });
};

const handleScanImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    scanner.value.preview = URL.createObjectURL(file);
    scanner.value.loading = true;

    try {
        const imageBase64 = await compressImage(file);
        const res = await fetch('/api/analyze-material-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify({ imageBase64, mediaType: 'image/jpeg' })
        });

        if (!res.ok) {
            const err = await res.json();
            alert('Erro ao analisar: ' + (err.error || 'Tente novamente'));
            scanner.value.loading = false;
            return;
        }

        const data = await res.json();
        if (data.name) newMaterial.value.name = data.name;
        if (data.cost) newMaterial.value.cost = data.cost;
        if (data.unit) newMaterial.value.unit = data.unit;
        if (data.quantity) newMaterial.value.quantity = data.quantity;

        scanner.value.open = false;
        scanner.value.preview = null;
    } catch (err) {
        console.error('Error analyzing image:', err);
        alert('Erro ao analisar a imagem. Verifique se ANTHROPIC_API_KEY está configurada.');
    }

    scanner.value.loading = false;
    e.target.value = '';
};

const closeScanner = () => {
    scanner.value.open = false;
    scanner.value.preview = null;
    scanner.value.loading = false;
};

onMounted(fetchMaterials);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Materiais (Insumos)</h1>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-medium text-gray-900">Novo Material</h2>
                    <button @click="scanner.open = true"
                        class="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                        <Camera class="w-4 h-4" />
                        Escanear Novelo com IA
                    </button>
                </div>

                <!-- AI Scanner Panel -->
                <div v-if="scanner.open" class="mb-6 bg-violet-50 border border-violet-200 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <Sparkles class="w-4 h-4 text-violet-500" />
                            <span class="font-medium text-violet-800 text-sm">Escaneamento Inteligente</span>
                        </div>
                        <button @click="closeScanner" class="text-violet-400 hover:text-violet-600">
                            <X class="w-4 h-4" />
                        </button>
                    </div>
                    <p class="text-xs text-violet-600 mb-3">Tire uma foto ou selecione a imagem do novelo ainda embalado. A IA vai ler os dados da embalagem e preencher o formulário automaticamente.</p>

                    <div v-if="scanner.loading" class="flex items-center gap-3 py-4 justify-center text-violet-600">
                        <Loader class="w-5 h-5 animate-spin" />
                        <span class="text-sm font-medium">Analisando a embalagem...</span>
                    </div>
                    <div v-else>
                        <div v-if="scanner.preview" class="mb-3">
                            <img :src="scanner.preview" alt="Prévia do novelo" class="h-32 object-contain rounded-lg border border-violet-200 mx-auto" />
                        </div>
                        <label class="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-2.5 px-5 rounded-lg cursor-pointer transition-colors w-full">
                            <Camera class="w-4 h-4" />
                            {{ scanner.preview ? 'Usar outra foto' : 'Selecionar foto do novelo' }}
                            <input type="file" accept="image/*" capture="environment" class="hidden" @change="handleScanImage" />
                        </label>
                    </div>
                </div>

                <form @submit.prevent="addMaterial" class="flex flex-wrap gap-4 items-end">
                    <div class="flex-2 min-w-[200px]">
                        <label for="mat-name" class="block text-sm font-medium text-gray-700">Nome do Material</label>
                        <input id="mat-name" type="text" v-model="newMaterial.name" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                            placeholder="Ex: Fio Anne Rosa Quartzo 100m" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label for="mat-cost" class="block text-sm font-medium text-gray-700">Custo Total (R$)</label>
                        <input id="mat-cost" type="number" step="0.01" v-model="newMaterial.cost" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label for="mat-unit" class="block text-sm font-medium text-gray-700">Unidade</label>
                        <select id="mat-unit" v-model="newMaterial.unit"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border">
                            <option value="novelo">Novelo(s)</option>
                            <option value="metros">Metros</option>
                            <option value="gramas">Gramas</option>
                            <option value="unidade">Unidade(s)</option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[150px]">
                        <label for="mat-qty" class="block text-sm font-medium text-gray-700">Quantidade Comprada</label>
                        <input id="mat-qty" type="number" step="0.01" v-model="newMaterial.quantity" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
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
                                R$ {{ (Number(mat.cost) / Number(mat.quantity)).toFixed(2) }} / {{ mat.unit }}
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
