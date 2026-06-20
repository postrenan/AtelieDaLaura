<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Camera, Loader, Sparkles, X, Image, RotateCcw, Zap, Pencil, Trash2, Check } from '@lucide/vue';

const materials = ref([]);
const newMaterial = ref({ name: '', cost: 0, unit: 'novelo', quantity: 1 });
const editingId = ref(null);
const editForm = ref({});

// scanner states: 'closed' | 'idle' | 'camera' | 'preview' | 'loading'
const scannerMode = ref('closed');
const capturedPreview = ref(null);
const capturedBase64 = ref(null);
const cameraError = ref('');
const videoRef = ref(null);
let activeStream = null;

const fetchMaterials = async () => {
    try {
        const res = await fetch('/api/materials', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') } });
        const data = await res.json();
        materials.value = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('Error fetching materials', e);
    }
};

const addMaterial = async () => {
    try {
        const res = await fetch('/api/materials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify(newMaterial.value)
        });
        const saved = await res.json();
        materials.value.push(saved);
        newMaterial.value = { name: '', cost: 0, unit: 'novelo', quantity: 1 };
    } catch (e) {
        console.error('Error adding material', e);
    }
};

const startEdit = (mat) => {
    editingId.value = mat.id;
    editForm.value = { ...mat };
};

const cancelEdit = () => {
    editingId.value = null;
    editForm.value = {};
};

const saveEdit = async (id) => {
    try {
        const res = await fetch(`/api/materials/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify(editForm.value)
        });
        const updated = await res.json();
        const idx = materials.value.findIndex(m => m.id === id);
        if (idx !== -1) materials.value[idx] = updated;
        cancelEdit();
    } catch (e) {
        console.error('Error updating material', e);
    }
};

const deleteMaterial = async (id) => {
    if (!confirm('Excluir este material permanentemente?')) return;
    try {
        await fetch(`/api/materials/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') }
        });
        materials.value = materials.value.filter(m => m.id !== id);
    } catch (e) {
        console.error('Error deleting material', e);
    }
};

// ---- Camera scanner ----
const stopCamera = () => {
    if (activeStream) { activeStream.getTracks().forEach(t => t.stop()); activeStream = null; }
};

const openScanner = () => {
    capturedPreview.value = null; capturedBase64.value = null; cameraError.value = '';
    scannerMode.value = 'idle';
};

const closeScanner = () => {
    stopCamera(); scannerMode.value = 'closed';
    capturedPreview.value = null; capturedBase64.value = null;
};

const startCamera = async () => {
    cameraError.value = ''; scannerMode.value = 'camera';
    await new Promise(r => setTimeout(r, 80));
    try {
        activeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.value) videoRef.value.srcObject = activeStream;
    } catch (err) {
        cameraError.value = 'Não foi possível acessar a câmera. Verifique as permissões do navegador.';
        scannerMode.value = 'idle';
        console.error('Camera error:', err);
    }
};

const captureFromCamera = () => {
    if (!videoRef.value) return;
    const video = videoRef.value;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    capturedPreview.value = dataUrl; capturedBase64.value = dataUrl.split(',')[1];
    stopCamera(); scannerMode.value = 'preview';
};

const compressAndReadFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 1280;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
                if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
                else { width = Math.round((width * MAX) / height); height = MAX; }
            }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
        };
    };
});

const handleGalleryFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const dataUrl = await compressAndReadFile(file);
    capturedPreview.value = dataUrl; capturedBase64.value = dataUrl.split(',')[1];
    scannerMode.value = 'preview'; e.target.value = '';
};

const retakePhoto = () => { capturedPreview.value = null; capturedBase64.value = null; scannerMode.value = 'idle'; };

const analyzeImage = async () => {
    if (!capturedBase64.value) return;
    scannerMode.value = 'loading';
    try {
        const res = await fetch('/api/analyze-material-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify({ imageBase64: capturedBase64.value, mediaType: 'image/jpeg' })
        });
        if (!res.ok) {
            const err = await res.json();
            alert('Erro ao analisar: ' + (err.error || 'Tente novamente'));
            scannerMode.value = 'preview'; return;
        }
        const data = await res.json();
        if (data.name) newMaterial.value.name = data.name;
        if (data.cost) newMaterial.value.cost = data.cost;
        if (data.unit) newMaterial.value.unit = data.unit;
        if (data.quantity) newMaterial.value.quantity = data.quantity;
        closeScanner();
    } catch (err) {
        console.error('Error analyzing image:', err);
        alert('Erro ao analisar. Verifique se GROQ_API_KEY está configurada.');
        scannerMode.value = 'preview';
    }
};

onMounted(fetchMaterials);
onUnmounted(stopCamera);
</script>

<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-bold text-gray-900">Materiais (Insumos)</h1>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-medium text-gray-900">Novo Material</h2>
                    <button @click="openScanner"
                        class="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                        <Camera class="w-4 h-4" />
                        Escanear com IA
                    </button>
                </div>

                <!-- Scanner Panel -->
                <div v-if="scannerMode !== 'closed'" class="mb-6 bg-violet-50 border border-violet-200 rounded-xl overflow-hidden">
                    <div class="flex items-center justify-between px-4 py-3 border-b border-violet-200">
                        <div class="flex items-center gap-2">
                            <Sparkles class="w-4 h-4 text-violet-500" />
                            <span class="font-semibold text-violet-800 text-sm">Scanner Inteligente de Novelos</span>
                        </div>
                        <button @click="closeScanner" class="text-violet-400 hover:text-violet-700 transition-colors">
                            <X class="w-4 h-4" />
                        </button>
                    </div>

                    <div v-if="scannerMode === 'idle'" class="p-5">
                        <p class="text-sm text-violet-700 mb-4 text-center">Aponte a câmera para a embalagem do novelo. A IA vai ler o nome, metragem e gramagem automaticamente.</p>
                        <p v-if="cameraError" class="text-xs text-red-500 mb-3 text-center bg-red-50 rounded-lg p-2">{{ cameraError }}</p>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <button @click="startCamera" class="flex-1 flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 px-4 rounded-xl transition-colors">
                                <Camera class="w-5 h-5" /> Abrir Câmera
                            </button>
                            <label class="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-violet-700 font-bold py-3 px-4 rounded-xl border-2 border-violet-200 cursor-pointer transition-colors">
                                <Image class="w-5 h-5" /> Escolher da Galeria
                                <input type="file" accept="image/*" class="hidden" @change="handleGalleryFile" />
                            </label>
                        </div>
                    </div>

                    <div v-if="scannerMode === 'camera'" class="flex flex-col">
                        <div class="relative bg-black">
                            <video ref="videoRef" autoplay playsinline muted class="w-full max-h-72 object-cover"></video>
                            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div class="w-56 h-36 border-2 border-white/70 rounded-xl relative">
                                    <span class="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg"></span>
                                    <span class="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg"></span>
                                    <span class="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg"></span>
                                    <span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg"></span>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 flex flex-col sm:flex-row gap-3 items-center">
                            <p class="text-xs text-violet-600 flex-1 text-center sm:text-left">Centralize a etiqueta do novelo no enquadramento e capture.</p>
                            <div class="flex gap-3">
                                <button @click="scannerMode = 'idle'; stopCamera()" class="flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-700 font-medium px-3 py-2 rounded-lg hover:bg-violet-100 transition-colors">
                                    <RotateCcw class="w-4 h-4" /> Voltar
                                </button>
                                <button @click="captureFromCamera" class="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-2 px-5 rounded-xl transition-colors shadow-sm">
                                    <Camera class="w-4 h-4" /> Capturar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="scannerMode === 'preview'" class="p-5">
                        <div class="flex justify-center mb-4">
                            <img :src="capturedPreview" alt="Foto capturada do novelo" class="max-h-52 rounded-xl border-2 border-violet-200 object-contain shadow-sm" />
                        </div>
                        <div class="flex gap-3">
                            <button @click="retakePhoto" class="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-violet-700 font-bold py-2.5 px-4 rounded-xl border-2 border-violet-200 transition-colors text-sm">
                                <RotateCcw class="w-4 h-4" /> Tirar outra
                            </button>
                            <button @click="analyzeImage" class="flex-1 flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm">
                                <Zap class="w-4 h-4" /> Analisar com IA
                            </button>
                        </div>
                    </div>

                    <div v-if="scannerMode === 'loading'" class="flex flex-col items-center justify-center gap-3 py-10">
                        <Loader class="w-8 h-8 text-violet-500 animate-spin" />
                        <p class="text-sm font-medium text-violet-700">Lendo a embalagem com IA...</p>
                        <p class="text-xs text-violet-400">Isso pode levar alguns segundos</p>
                    </div>
                </div>

                <form @submit.prevent="addMaterial" class="flex flex-wrap gap-4 items-end">
                    <div class="flex-2 min-w-[200px]">
                        <label for="mat-name" class="block text-sm font-medium text-gray-700">Nome do Material</label>
                        <input id="mat-name" type="text" v-model="newMaterial.name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" placeholder="Ex: Fio Anne Rosa Quartzo 100m" />
                    </div>
                    <div class="flex-1 min-w-[130px]">
                        <label for="mat-cost" class="block text-sm font-medium text-gray-700">Custo Total (R$)</label>
                        <input id="mat-cost" type="number" step="0.01" v-model="newMaterial.cost" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                    </div>
                    <div class="flex-1 min-w-[130px]">
                        <label for="mat-unit" class="block text-sm font-medium text-gray-700">Unidade</label>
                        <select id="mat-unit" v-model="newMaterial.unit" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border">
                            <option value="novelo">Novelo(s)</option>
                            <option value="metros">Metros</option>
                            <option value="gramas">Gramas</option>
                            <option value="unidade">Unidade(s)</option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[130px]">
                        <label for="mat-qty" class="block text-sm font-medium text-gray-700">Quantidade</label>
                        <input id="mat-qty" type="number" step="0.01" v-model="newMaterial.quantity" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
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
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo/Un.</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <template v-for="mat in materials" :key="mat.id">
                            <!-- Edit row -->
                            <tr v-if="editingId === mat.id" class="bg-amber-50">
                                <td class="px-4 py-2">
                                    <input v-model="editForm.name" class="w-full rounded border border-gray-300 p-1.5 text-sm focus:border-amber-400 focus:outline-none" />
                                </td>
                                <td class="px-4 py-2">
                                    <input v-model="editForm.cost" type="number" step="0.01" class="w-24 rounded border border-gray-300 p-1.5 text-sm focus:border-amber-400 focus:outline-none" />
                                </td>
                                <td class="px-4 py-2">
                                    <input v-model="editForm.quantity" type="number" step="0.01" class="w-20 rounded border border-gray-300 p-1.5 text-sm focus:border-amber-400 focus:outline-none" />
                                </td>
                                <td class="px-4 py-2">
                                    <select v-model="editForm.unit" class="rounded border border-gray-300 p-1.5 text-sm focus:border-amber-400 focus:outline-none">
                                        <option value="novelo">Novelo(s)</option>
                                        <option value="metros">Metros</option>
                                        <option value="gramas">Gramas</option>
                                        <option value="unidade">Unidade(s)</option>
                                    </select>
                                </td>
                                <td class="px-4 py-2 text-sm text-gray-400">—</td>
                                <td class="px-4 py-2 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button @click="saveEdit(mat.id)" class="flex items-center gap-1 text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors">
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
                                <td class="px-4 py-4 text-sm font-medium text-gray-900">{{ mat.name }}</td>
                                <td class="px-4 py-4 text-sm text-gray-500">R$ {{ Number(mat.cost).toFixed(2) }}</td>
                                <td class="px-4 py-4 text-sm text-gray-500">{{ mat.quantity }}</td>
                                <td class="px-4 py-4 text-sm text-gray-500">{{ mat.unit }}</td>
                                <td class="px-4 py-4 text-sm text-gray-500">
                                    R$ {{ (Number(mat.cost) / Number(mat.quantity)).toFixed(2) }}
                                </td>
                                <td class="px-4 py-4 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button @click="startEdit(mat)" class="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1 rounded hover:bg-amber-50 transition-colors">
                                            <Pencil class="w-3 h-3" /> Editar
                                        </button>
                                        <button @click="deleteMaterial(mat.id)" class="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                            <Trash2 class="w-3 h-3" /> Excluir
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <tr v-if="materials.length === 0">
                            <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500">Nenhum material registrado.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
