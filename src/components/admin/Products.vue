<script setup>
import { ref, onMounted } from 'vue';
import { Trash2, Upload, Eye, EyeOff, ChevronLeft, ChevronRight, Plus, X } from '@lucide/vue';

const products = ref([]);
const isAdding = ref(false);
const isUploading = ref(false);
const previewIndexes = ref({});

const newProduct = ref({
    name: '',
    description: '',
    price: 0,
    images: [],
    whatsapp_message: ''
});

const fetchProducts = async () => {
    try {
        const res = await fetch('/api/products/all', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') }
        });
        const data = await res.json();
        products.value = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('Error fetching products', e);
    }
};

const compressToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 900;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
                if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
                else { width = Math.round((width * MAX) / height); height = MAX; }
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.78));
        };
    };
});

const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    isUploading.value = true;
    for (const file of files) {
        const dataUrl = await compressToBase64(file);
        newProduct.value.images.push(dataUrl);
    }
    isUploading.value = false;
    e.target.value = '';
};

const removeNewImage = (index) => {
    newProduct.value.images.splice(index, 1);
};

const addProduct = async () => {
    if (!newProduct.value.name) return;
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify(newProduct.value)
        });
        const saved = await res.json();
        products.value.unshift(saved);
        newProduct.value = { name: '', description: '', price: 0, images: [], whatsapp_message: '' };
        isAdding.value = false;
    } catch (e) {
        console.error('Error adding product', e);
    }
};

const toggleActive = async (product) => {
    try {
        const res = await fetch(`/api/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') },
            body: JSON.stringify({ ...product, active: !product.active })
        });
        const updated = await res.json();
        const idx = products.value.findIndex(p => p.id === product.id);
        if (idx !== -1) products.value[idx] = updated;
    } catch (e) {
        console.error('Error toggling product', e);
    }
};

const deleteProduct = async (id) => {
    if (!confirm('Excluir este produto permanentemente?')) return;
    try {
        await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('alma_token') }
        });
        products.value = products.value.filter(p => p.id !== id);
    } catch (e) {
        console.error('Error deleting product', e);
    }
};

const prevImage = (productId, length) => {
    const cur = previewIndexes.value[productId] ?? 0;
    previewIndexes.value[productId] = (cur - 1 + length) % length;
};

const nextImage = (productId, length) => {
    const cur = previewIndexes.value[productId] ?? 0;
    previewIndexes.value[productId] = (cur + 1) % length;
};

onMounted(fetchProducts);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Produtos</h1>
                <p class="text-gray-500 text-sm mt-1">Gerencie os produtos exibidos na página pública com fotos e preços.</p>
            </div>
            <button @click="isAdding = !isAdding" class="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-5 rounded-lg transition-colors">
                <Plus class="w-4 h-4" />
                Novo Produto
            </button>
        </div>

        <!-- Add Product Form -->
        <div v-if="isAdding" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 class="text-lg font-semibold text-gray-900">Novo Produto</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Nome do Produto *</label>
                    <input type="text" v-model="newProduct.name" required placeholder="Ex: Amigurumi Ursinho"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Preço (R$)</label>
                    <input type="number" step="0.01" v-model="newProduct.price"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea v-model="newProduct.description" rows="2" placeholder="Descreva o produto, materiais usados, tamanhos disponíveis..."
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"></textarea>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Mensagem WhatsApp (opcional)</label>
                <input type="text" v-model="newProduct.whatsapp_message" placeholder="Ex: Olá! Tenho interesse no Amigurumi Ursinho."
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border" />
                <p class="text-xs text-gray-400 mt-1">Se vazio, uma mensagem padrão será gerada com o nome do produto.</p>
            </div>

            <!-- Image Upload -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fotos do Produto</label>
                <label class="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-rose-300 hover:bg-rose-50 transition-colors">
                    <Upload class="w-5 h-5 text-gray-400" />
                    <span class="text-sm text-gray-500">
                        <span v-if="isUploading" class="text-rose-500 font-medium">Comprimindo fotos...</span>
                        <span v-else>Clique para adicionar fotos <span class="text-xs text-gray-400">(várias de uma vez)</span></span>
                    </span>
                    <input type="file" multiple accept="image/*" class="hidden" @change="handleImageUpload" :disabled="isUploading" />
                </label>
                <p class="text-xs text-gray-400 mt-1">As fotos são comprimidas automaticamente e salvas no banco de dados.</p>

                <div v-if="newProduct.images.length > 0" class="flex flex-wrap gap-3 mt-3">
                    <div v-for="(img, i) in newProduct.images" :key="i" class="relative group">
                        <img :src="img" class="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                        <button @click="removeNewImage(i)" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X class="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button @click="isAdding = false" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancelar</button>
                <button @click="addProduct" class="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold">Salvar Produto</button>
            </div>
        </div>

        <!-- Products List -->
        <div v-if="products.length === 0 && !isAdding" class="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
            <p class="font-medium">Nenhum produto cadastrado ainda.</p>
            <p class="text-sm mt-1">Clique em "Novo Produto" para começar.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="product in products" :key="product.id"
                :class="['bg-white rounded-xl shadow-sm border overflow-hidden', product.active ? 'border-gray-100' : 'border-gray-200 opacity-60']">

                <!-- Image Carousel -->
                <div class="relative h-52 bg-gray-100">
                    <template v-if="product.images && product.images.length > 0">
                        <img :src="product.images[previewIndexes[product.id] ?? 0]"
                            class="w-full h-full object-cover" :alt="product.name" />
                        <div v-if="product.images.length > 1" class="absolute inset-0 flex items-center justify-between px-2">
                            <button @click="prevImage(product.id, product.images.length)"
                                class="bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors">
                                <ChevronLeft class="w-4 h-4" />
                            </button>
                            <button @click="nextImage(product.id, product.images.length)"
                                class="bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors">
                                <ChevronRight class="w-4 h-4" />
                            </button>
                        </div>
                        <div v-if="product.images.length > 1" class="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                            <button v-for="(_, i) in product.images" :key="i"
                                @click="previewIndexes[product.id] = i"
                                :class="['w-1.5 h-1.5 rounded-full transition-colors', (previewIndexes[product.id] ?? 0) === i ? 'bg-white' : 'bg-white/50']">
                            </button>
                        </div>
                        <span class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                            {{ (previewIndexes[product.id] ?? 0) + 1 }}/{{ product.images.length }}
                        </span>
                    </template>
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-sm">Sem fotos</div>
                </div>

                <!-- Info -->
                <div class="p-4 space-y-2">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="font-bold text-gray-900 leading-tight">{{ product.name }}</h3>
                        <span v-if="product.price" class="text-rose-600 font-bold text-sm whitespace-nowrap">
                            R$ {{ Number(product.price).toFixed(2) }}
                        </span>
                    </div>
                    <p v-if="product.description" class="text-gray-500 text-sm line-clamp-2">{{ product.description }}</p>

                    <!-- Actions -->
                    <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                        <button @click="toggleActive(product)"
                            :class="['flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors', product.active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200']">
                            <Eye v-if="product.active" class="w-3.5 h-3.5" />
                            <EyeOff v-else class="w-3.5 h-3.5" />
                            {{ product.active ? 'Visível' : 'Oculto' }}
                        </button>
                        <button @click="deleteProduct(product.id)"
                            class="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 class="w-3.5 h-3.5" />
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
