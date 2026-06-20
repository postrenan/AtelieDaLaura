<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Camera, Loader, Sparkles, X, Image, RotateCcw, Zap, Pencil, Trash2, Check } from '@lucide/vue';

const materials = ref([]);
const newMaterial = ref({ name: '', cost: 0, unit: 'novelo', quantity: 1 });
const editingId = ref(null);
const editForm = ref({});

// scanner states: 'closed' | 'idle' | 'camera' | 'review' | 'loading'
const scannerMode = ref('closed');
const capturedImages = ref([]); // [{ preview, base64 }]
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
    capturedImages.value = []; cameraError.value = '';
    scannerMode.value = 'idle';
};

const closeScanner = () => {
    stopCamera(); scannerMode.value = 'closed';
    capturedImages.value = [];
};

const startCamera = async () => {
    cameraError.value = '';
    scannerMode.value = 'camera';
    await new Promise(r => setTimeout(r, 80));
    try {
        activeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.value) videoRef.value.srcObject = activeStream;
    } catch (err) {
        cameraError.value = 'Não foi possível acessar a câmera. Verifique as permissões do navegador.';
        scannerMode.value = capturedImages.value.length ? 'review' : 'idle';
        console.error('Camera error:', err);
    }
};

const captureFromCamera = () => {
    if (!videoRef.value) return;
    const video = videoRef.value;
    const canvas = document.createElement('canvas');
    const MAX = 800;
    let w = video.videoWidth || 1280, h = video.videoHeight || 720;
    if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
        else { w = Math.round((w * MAX) / h); h = MAX; }
    }
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    capturedImages.value.push({ preview: dataUrl, base64: dataUrl.split(',')[1] });
    stopCamera(); scannerMode.value = 'review';
};

const compressAndReadFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 800;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
                if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
                else { width = Math.round((width * MAX) / height); height = MAX; }
            }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
            resolve(dataUrl);
        };
    };
});

const handleGalleryFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    for (const file of files) {
        const dataUrl = await compressAndReadFile(file);
        capturedImages.value.push({ preview: dataUrl, base64: dataUrl.split(',')[1] });
    }
    scannerMode.value = 'review';
    e.target.value = '';
};

const removeCapture = (index) => {
    capturedImages.value.splice(index, 1);
    if (capturedImages.value.length === 0) scannerMode.value = 'idle';
};

const addMoreCamera = async () => {
    cameraError.value = '';
    scannerMode.value = 'camera';
    await new Promise(r => setTimeout(r, 80));
    try {
        activeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.value) videoRef.value.srcObject = activeStream;
    } catch (err) {
        cameraError.value = 'Não foi possível acessar a câmera.';
        scannerMode.value = 'review';
        console.error('Camera error:', err);
    }
};

const analyzeImages = async () => {
    if (!capturedImages.value.length) return;
    scannerMode.value = 'loading';
    try {
        const res = await fetch('/api/analyze-material-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify({
                images: capturedImages.value.map(img => ({ base64: img.base64, mediaType: 'image/jpeg' }))
            })
        });
        if (!res.ok) {
            let errMsg = 'Tente novamente';
            try { const body = await res.json(); errMsg = body.error || errMsg; } catch {}
            alert('Erro ao analisar: ' + errMsg);
            scannerMode.value = 'review'; return;
        }
        const data = await res.json();
        if (data.name) newMaterial.value.name = data.name;
        if (data.cost) newMaterial.value.cost = data.cost;
        if (data.unit) newMaterial.value.unit = data.unit;
        if (data.quantity) newMaterial.value.quantity = data.quantity;
        closeScanner();
    } catch (err) {
        console.error('Error analyzing image:', err);
        alert('Erro de rede ao conectar com o servidor: ' + err.message);
        scannerMode.value = 'review';
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

                    <!-- idle: choose source -->
                    <div v-if="scannerMode === 'idle'" class="p-5">
                        <p class="text-sm text-violet-700 mb-1 text-center">Tire fotos da embalagem do novelo — frente, verso, lateral.</p>
                        <p class="text-xs text-violet-500 mb-4 text-center">Quanto mais fotos, mais informações a IA consegue ler.</p>
                        <p v-if="cameraError" class="text-xs text-red-500 mb-3 text-center bg-red-50 rounded-lg p-2">{{ cameraError }}</p>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <button @click="startCamera" class="flex-1 flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 px-4 rounded-xl transition-colors">
                                <Camera class="w-5 h-5" /> Abrir Câmera
                            </button>
                            <label class="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-violet-700 font-bold py-3 px-4 rounded-xl border-2 border-violet-200 cursor-pointer transition-colors">
                                <Image class="w-5 h-5" /> Escolher da Galeria
                                <input type="file" accept="image/*" multiple class="hidden" @change="handleGalleryFiles" />
                            </label>
                        </div>
                    </div>

                    <!-- camera: live view -->
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
                            <div v-if="capturedImages.length > 0" class="absolute top-2 left-2 bg-violet-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {{ capturedImages.length }} foto{{ capturedImages.length > 1 ? 's' : '' }}
                            </div>
                        </div>
                        <div class="p-4 flex flex-col sm:flex-row gap-3 items-center">
                            <p class="text-xs text-violet-600 flex-1 text-center sm:text-left">
                                Capture quantas fotos precisar (frente, verso, lateral).
                            </p>
                            <div class="flex gap-3">
                                <button @click="() => { stopCamera(); scannerMode = capturedImages.length ? 'review' : 'idle'; }"
                                    class="flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-700 font-medium px-3 py-2 rounded-lg hover:bg-violet-100 transition-colors">
                                    <RotateCcw class="w-4 h-4" /> {{ capturedImages.length ? 'Ver fotos' : 'Voltar' }}
                                </button>
                                <button @click="captureFromCamera" class="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-2 px-5 rounded-xl transition-colors shadow-sm">
                                    <Camera class="w-4 h-4" /> Capturar
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- review: show all captures, add more or analyze -->
                    <div v-if="scannerMode === 'review'" class="p-5 space-y-4">
                        <div>
                            <p class="text-sm font-medium text-violet-800 mb-2">
                                {{ capturedImages.length }} foto{{ capturedImages.length > 1 ? 's' : '' }} capturada{{ capturedImages.length > 1 ? 's' : '' }}
                                <span class="text-violet-500 font-normal">— adicione mais se necessário</span>
                            </p>
                            <div class="flex flex-wrap gap-2">
                                <div v-for="(img, i) in capturedImages" :key="i" class="relative group">
                                    <img :src="img.preview" :alt="`Foto ${i + 1}`"
                                        class="w-20 h-20 object-cover rounded-lg border-2 border-violet-200 shadow-sm" />
                                    <button @click="removeCapture(i)"
                                        class="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                        <X class="w-3 h-3" />
                                    </button>
                                    <span class="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">{{ i + 1 }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- add more buttons -->
                        <div class="flex gap-2">
                            <button @click="addMoreCamera"
                                class="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium px-3 py-2 rounded-lg border border-violet-200 hover:bg-violet-50 transition-colors">
                                <Camera class="w-3.5 h-3.5" /> + Câmera
                            </button>
                            <label class="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium px-3 py-2 rounded-lg border border-violet-200 hover:bg-violet-50 cursor-pointer transition-colors">
                                <Image class="w-3.5 h-3.5" /> + Galeria
                                <input type="file" accept="image/*" multiple class="hidden" @change="handleGalleryFiles" />
                            </label>
                        </div>

                        <button @click="analyzeImages"
                            class="w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">
                            <Zap class="w-4 h-4" />
                            Analisar {{ capturedImages.length }} foto{{ capturedImages.length > 1 ? 's' : '' }} com IA
                        </button>
                    </div>

                    <!-- loading -->
                    <div v-if="scannerMode === 'loading'" class="flex flex-col items-center justify-center gap-3 py-10">
                        <Loader class="w-8 h-8 text-violet-500 animate-spin" />
                        <p class="text-sm font-medium text-violet-700">Analisando {{ capturedImages.length }} foto{{ capturedImages.length > 1 ? 's' : '' }} com IA...</p>
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
