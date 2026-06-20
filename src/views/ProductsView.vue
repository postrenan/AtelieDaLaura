<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight, MessageCircle, ArrowLeft, Heart, ShoppingBag } from '@lucide/vue';

const WHATSAPP_NUMBER = "555596992684";
const products = ref([]);
const carouselIndexes = ref({});
const autoPlayTimers = ref({});

const fetchProducts = async () => {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        products.value = Array.isArray(data) ? data : [];
        products.value.forEach(p => {
            carouselIndexes.value[p.id] = 0;
        });
        startAutoPlay();
    } catch (e) {
        console.error('Error fetching products', e);
    }
};

const startAutoPlay = () => {
    products.value.forEach(p => {
        if (p.images && p.images.length > 1) {
            autoPlayTimers.value[p.id] = setInterval(() => {
                carouselIndexes.value[p.id] = (carouselIndexes.value[p.id] + 1) % p.images.length;
            }, 3500);
        }
    });
};

const stopAutoPlay = (productId) => {
    if (autoPlayTimers.value[productId]) {
        clearInterval(autoPlayTimers.value[productId]);
    }
};

const restartAutoPlay = (product) => {
    stopAutoPlay(product.id);
    if (product.images && product.images.length > 1) {
        autoPlayTimers.value[product.id] = setInterval(() => {
            carouselIndexes.value[product.id] = (carouselIndexes.value[product.id] + 1) % product.images.length;
        }, 3500);
    }
};

const prevSlide = (product) => {
    stopAutoPlay(product.id);
    const len = product.images.length;
    carouselIndexes.value[product.id] = (carouselIndexes.value[product.id] - 1 + len) % len;
    restartAutoPlay(product);
};

const nextSlide = (product) => {
    stopAutoPlay(product.id);
    const len = product.images.length;
    carouselIndexes.value[product.id] = (carouselIndexes.value[product.id] + 1) % len;
    restartAutoPlay(product);
};

const goToSlide = (product, index) => {
    stopAutoPlay(product.id);
    carouselIndexes.value[product.id] = index;
    restartAutoPlay(product);
};

const orderProduct = (product) => {
    const msg = product.whatsapp_message || `Olá, Alma Tramada! Tenho interesse no produto: *${product.name}*.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
};

onMounted(fetchProducts);

onUnmounted(() => {
    Object.values(autoPlayTimers.value).forEach(t => clearInterval(t));
});
</script>

<template>
    <div class="font-sans bg-alma-cream text-alma-text antialiased min-h-screen">

        <!-- Navbar -->
        <nav class="fixed w-full z-50 top-0">
            <div class="absolute inset-0 bg-white/80 backdrop-blur-md shadow-sm border-b border-alma-light"></div>
            <div class="max-w-6xl mx-auto px-4 relative">
                <div class="flex justify-between items-center h-20">
                    <router-link to="/" class="flex items-center">
                        <img src="/SemfundoLogoAlmaTramada.png" alt="Alma Tramada" class="h-14 w-auto" />
                    </router-link>
                    <div class="hidden md:flex space-x-8">
                        <router-link to="/" class="font-semibold text-alma-text hover:text-alma-brown transition-colors flex items-center gap-1">
                            <ArrowLeft class="w-4 h-4" /> Início
                        </router-link>
                        <router-link to="/produtos" class="font-semibold text-alma-brown border-b-2 border-alma-rose pb-0.5 transition-colors">
                            Nossos Produtos
                        </router-link>
                    </div>
                    <a :href="`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá, Alma Tramada! Vim pelo site e quero fazer uma encomenda!')}`"
                        target="_blank"
                        class="bg-alma-brown hover:bg-alma-text text-white px-6 py-2 rounded-full font-bold shadow-md transition-transform transform hover:scale-105 flex items-center gap-2">
                        <MessageCircle class="w-5 h-5" />
                        WhatsApp
                    </a>
                </div>
            </div>
        </nav>

        <!-- Header -->
        <section class="pt-32 pb-12 px-4 text-center">
            <div class="inline-flex items-center gap-2 bg-alma-light text-alma-brown px-4 py-2 rounded-full text-sm font-bold mb-4">
                <Heart class="w-4 h-4 fill-alma-rose text-alma-rose" />
                Feito à mão, com alma
            </div>
            <h1 class="font-display text-4xl md:text-5xl font-bold text-alma-brown mb-3">
                Nossos Produtos
            </h1>
            <p class="text-alma-text max-w-xl mx-auto">
                Cada peça é única e feita com muito carinho. Clique em "Encomendar" para pedir a sua!
            </p>
        </section>

        <!-- Products Grid -->
        <section class="pb-20 px-4">
            <div class="max-w-6xl mx-auto">

                <!-- Empty state -->
                <div v-if="products.length === 0" class="text-center py-24">
                    <ShoppingBag class="w-16 h-16 text-alma-rose/40 mx-auto mb-4" />
                    <p class="text-alma-text font-medium">Produtos em breve!</p>
                    <p class="text-sm text-alma-text/60 mt-1">Enquanto isso, fale connosco pelo WhatsApp.</p>
                    <a :href="`https://wa.me/${WHATSAPP_NUMBER}`" target="_blank"
                        class="inline-flex items-center gap-2 mt-6 bg-alma-brown text-white px-6 py-3 rounded-full font-bold hover:bg-alma-text transition-colors">
                        <MessageCircle class="w-5 h-5" />
                        Falar no WhatsApp
                    </a>
                </div>

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div v-for="product in products" :key="product.id"
                        class="bg-white rounded-3xl shadow-sm border border-alma-light overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">

                        <!-- Carousel -->
                        <div class="relative h-64 bg-alma-cream overflow-hidden">
                            <template v-if="product.images && product.images.length > 0">
                                <transition-group name="fade" tag="div" class="relative h-full">
                                    <img
                                        v-for="(img, i) in product.images"
                                        :key="i"
                                        v-show="(carouselIndexes[product.id] ?? 0) === i"
                                        :src="img"
                                        :alt="`${product.name} - foto ${i + 1}`"
                                        class="absolute inset-0 w-full h-full object-cover"
                                    />
                                </transition-group>

                                <!-- Arrows -->
                                <div v-if="product.images.length > 1" class="absolute inset-0 flex items-center justify-between px-3 opacity-0 hover:opacity-100 transition-opacity">
                                    <button @click="prevSlide(product)"
                                        class="bg-white/80 hover:bg-white shadow-md text-alma-brown rounded-full p-1.5 transition-all">
                                        <ChevronLeft class="w-4 h-4" />
                                    </button>
                                    <button @click="nextSlide(product)"
                                        class="bg-white/80 hover:bg-white shadow-md text-alma-brown rounded-full p-1.5 transition-all">
                                        <ChevronRight class="w-4 h-4" />
                                    </button>
                                </div>

                                <!-- Dots -->
                                <div v-if="product.images.length > 1" class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                    <button
                                        v-for="(_, i) in product.images"
                                        :key="i"
                                        @click="goToSlide(product, i)"
                                        :class="['w-2 h-2 rounded-full transition-all', (carouselIndexes[product.id] ?? 0) === i ? 'bg-alma-brown scale-110' : 'bg-alma-brown/30']">
                                    </button>
                                </div>
                            </template>
                            <div v-else class="w-full h-full flex items-center justify-center">
                                <img src="/Semfundomonograma.png" alt="Alma Tramada" class="w-24 h-24 object-contain opacity-30" />
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="p-6 flex flex-col flex-1">
                            <h3 class="font-display text-xl font-bold text-alma-brown mb-2">{{ product.name }}</h3>
                            <p v-if="product.description" class="text-alma-text text-sm leading-relaxed mb-4 flex-1">{{ product.description }}</p>
                            <div class="flex-1" v-else></div>

                            <div class="flex items-center justify-between mt-4 pt-4 border-t border-alma-light">
                                <div>
                                    <p v-if="product.price" class="font-display text-2xl font-bold text-alma-brown">
                                        R$ {{ Number(product.price).toFixed(2) }}
                                    </p>
                                    <p v-else class="text-sm text-alma-text/60 italic">Consulte o preço</p>
                                </div>
                                <button @click="orderProduct(product)"
                                    class="flex items-center gap-2 bg-alma-brown hover:bg-alma-text text-white font-bold px-5 py-2.5 rounded-full transition-all transform hover:scale-105 shadow-sm text-sm">
                                    <MessageCircle class="w-4 h-4" />
                                    Encomendar
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- CTA -->
                <div v-if="products.length > 0" class="text-center mt-16">
                    <p class="text-alma-text mb-4">Não encontrou o que procura?</p>
                    <a :href="`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Tenho uma ideia para uma peça personalizada.')}`"
                        target="_blank"
                        class="inline-flex items-center gap-2 bg-alma-brown text-white px-8 py-3 rounded-full font-bold hover:bg-alma-text transition-colors shadow-lg">
                        <MessageCircle class="w-5 h-5" />
                        Peça algo personalizado
                    </a>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-white py-8 border-t border-alma-light text-center">
            <img src="/SemfundoLogoAlmaTramada.png" alt="Alma Tramada" class="h-10 w-auto mx-auto mb-3" />
            <p class="text-alma-text/60 text-sm">© 2026 Alma Tramada. Feito com <Heart class="w-3.5 h-3.5 inline text-alma-rose fill-alma-rose" />.</p>
        </footer>
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
