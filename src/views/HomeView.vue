<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

import {
  Scissors as ScissorsIcon, 
  Heart as HeartIcon, 
  MessageCircle as MessageCircleIcon, 
  Menu as MenuIcon, 
  Stars as StarsIcon,
  Sparkles as SparklesIcon, 
  Shirt as ShirtIcon, 
  Gift as GiftIcon, 
  HeartHandshake as HeartHandshakeIcon, 
  Crown as CrownIcon,
  Snowflake as SnowflakeIcon, 
  ShoppingBag as ShoppingBagIcon, 
  Palette as PaletteIcon, 
  Send as SendIcon
} from '@lucide/vue';

const WHATSAPP_NUMBER = "555596992684";
const isMenuOpen = ref(false);
const isScrolled = ref(false);
const feedbacks = ref([]);

const wpName = ref('');
const wpProduct = ref('uma Tiara/Faixa');
const wpDetails = ref('');

const phrases = [
  "amor.", 
  "afeto.", 
  "arte.", 
  "um abraço quentinho.", 
  "presente especial."
];
const currentText = ref('');
let phraseIndex = 0;
let letterIndex = 0;
let isDeleting = false;
let typingSpeed = 100;
let typingTimeout;

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

const openWhatsApp = (customMessage) => {
  const text = encodeURIComponent(customMessage);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
};

const buildAndSendWhatsApp = () => {
  const name = wpName.value.trim() || 'Alguém';
  const product = wpProduct.value;
  const details = wpDetails.value.trim();

  let message = `Olá Laurinha! O meu nome é ${name} e estou a entrar em contacto pelo teu site.\n\n`;
  message += `Gostaria de encomendar: *${product}*.\n`;
  
  if (details) {
      message += `\n*Detalhes:* ${details}\n`;
  }
  
  message += `\nComo podemos fazer?`;

  openWhatsApp(message);
};

const typeEffect = () => {
  const currentPhrase = phrases[phraseIndex];
  
  if (isDeleting) {
      currentText.value = currentPhrase.substring(0, letterIndex - 1);
      letterIndex--;
      typingSpeed = 50;
  } else {
      currentText.value = currentPhrase.substring(0, letterIndex + 1);
      letterIndex++;
      typingSpeed = 120;
  }

  if (!isDeleting && letterIndex === currentPhrase.length) {
      isDeleting = true;
      typingSpeed = 1500;
  } else if (isDeleting && letterIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typingSpeed = 500;
  }

  typingTimeout = setTimeout(typeEffect, typingSpeed);
};

const fetchFeedbacks = async () => {
    try {
        const res = await fetch('/api/feedbacks');
        feedbacks.value = await res.json();
    } catch (e) {
        console.error("Error fetching feedbacks", e);
    }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  typeEffect();
  fetchFeedbacks();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  clearTimeout(typingTimeout);
});
</script>

<template>
  <div class="font-sans bg-atelie-light text-atelie-text antialiased overflow-x-hidden min-h-screen">
    <!-- Navbar -->
    <nav :class="['fixed w-full z-50 top-0 transition-all duration-300', isScrolled ? 'shadow-md' : '']">
        <div class="absolute inset-0 bg-white/80 backdrop-blur-md shadow-sm border-b border-pink-100"></div>
        <div class="max-w-6xl mx-auto px-4 relative">
            <div class="flex justify-between items-center h-20">
                <a href="#" class="flex items-center gap-2" data-aos="fade-right">
                    <ScissorsIcon class="text-rose-400 w-8 h-8" />
                    <span class="font-display font-semibold text-2xl text-rose-500 tracking-wide">Ateliê da Laurinha</span>
                </a>
                
                <!-- Desktop Menu -->
                <div class="hidden md:flex space-x-8" data-aos="fade-down" data-aos-delay="100">
                    <a href="#inicio" class="font-semibold text-gray-600 hover:text-rose-500 transition-colors">Início</a>
                    <a href="#produtos" class="font-semibold text-gray-600 hover:text-rose-500 transition-colors">Criações</a>
                    <a href="#datas-especiais" class="font-semibold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1">
                        <HeartIcon class="w-4 h-4 fill-rose-500 text-rose-500" /> Presentes
                    </a>
                </div>

                <div class="hidden md:block" data-aos="fade-left" data-aos-delay="200">
                    <button @click="openWhatsApp('Olá Laurinha! Gostaria de fazer uma encomenda.')" class="bg-rose-400 hover:bg-rose-500 text-white px-6 py-2 rounded-full font-bold shadow-md shadow-rose-200 transition-transform transform hover:scale-105 flex items-center gap-2">
                        <MessageCircleIcon class="w-5 h-5" />
                        WhatsApp
                    </button>
                </div>

                <!-- Mobile Menu Button -->
                <button @click="toggleMenu" class="md:hidden text-gray-600 hover:text-rose-500 focus:outline-none z-50 relative">
                    <MenuIcon class="w-8 h-8" />
                </button>
            </div>
        </div>

        <!-- Mobile Menu Panel -->
        <div v-show="isMenuOpen" class="md:hidden absolute w-full bg-white shadow-xl border-b border-pink-100 top-20 left-0">
            <div class="flex flex-col px-4 pt-2 pb-6 space-y-4">
                <a href="#inicio" @click="isMenuOpen = false" class="font-semibold text-gray-600 hover:text-rose-500">Início</a>
                <a href="#produtos" @click="isMenuOpen = false" class="font-semibold text-gray-600 hover:text-rose-500">Criações</a>
                <a href="#datas-especiais" @click="isMenuOpen = false" class="font-semibold text-rose-500 flex items-center gap-2">
                    <HeartIcon class="w-4 h-4 fill-rose-500 text-rose-500" /> Presentes Especiais
                </a>
                <button @click="openWhatsApp('Olá Laurinha! Gostaria de fazer uma encomenda.'); isMenuOpen = false" class="bg-rose-400 text-white px-4 py-2 rounded-full font-bold text-center mt-4 flex justify-center items-center gap-2">
                    <MessageCircleIcon class="w-5 h-5" />
                    Chamar no WhatsApp
                </button>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="inicio" class="pt-32 pb-20 px-4 min-h-[90vh] flex items-center relative overflow-hidden">
        <!-- Decorative blobs -->
        <div class="absolute top-20 left-10 w-64 h-64 bg-atelie-blue/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div class="absolute top-40 right-10 w-72 h-72 bg-atelie-pink/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-8 left-40 w-72 h-72 bg-atelie-yellow/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div class="text-center md:text-left" data-aos="fade-up">
                <div class="inline-flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full text-sm font-bold mb-6">
                    <StarsIcon class="w-4 h-4 text-rose-500" />
                    Feito à mão, com muito amor
                </div>
                
                <h1 class="font-display text-5xl md:text-6xl font-bold text-gray-800 leading-tight mb-4">
                    Arte em <span class="text-rose-400">Crochê</span> e <span class="text-teal-400">Tricô</span>
                </h1>
                
                <div class="h-12 md:h-16 mb-6">
                    <h2 class="font-display text-3xl md:text-4xl font-semibold text-rose-500">
                        Crochê é <span class="text-purple-500 typing-cursor">{{ currentText }}</span>
                    </h2>
                </div>

                <p class="text-xl text-gray-600 mb-8 leading-relaxed">
                    Transformamos fios em peças únicas e personalizadas. Exatamente como sonhaste, direto para ti!
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button @click="openWhatsApp('Oi Laurinha! Vim pelo site e quero fazer uma encomenda incrível!')" class="bg-rose-400 hover:bg-rose-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-rose-200 transition-transform transform hover:scale-105 text-center flex justify-center items-center gap-2">
                        <MessageCircleIcon class="w-6 h-6" />
                        Encomendar no Whats
                    </button>
                    <a href="#produtos" class="bg-white border-2 border-rose-200 text-rose-500 hover:bg-rose-50 px-8 py-4 rounded-full font-bold text-lg transition-colors text-center">
                        Ver Criações
                    </a>
                </div>
            </div>
            
            <div class="relative flex justify-center items-center" data-aos="zoom-in" data-aos-delay="200">
                <div class="animate-float">
                    <div class="w-80 h-80 md:w-96 md:h-96 bg-gradient-to-tr from-rose-200 to-teal-100 blob-shape relative shadow-2xl flex items-center justify-center border-4 border-white">
                        <div class="absolute -top-4 -right-4 bg-white p-4 rounded-full shadow-lg transform rotate-12 animate-pulse-slow">
                            <SparklesIcon class="w-8 h-8 text-yellow-400" />
                        </div>
                        <div class="absolute -bottom-6 -left-6 bg-white p-4 rounded-full shadow-lg transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                            <HeartIcon class="w-8 h-8 text-rose-400 fill-rose-400" />
                        </div>
                        <ShirtIcon class="w-32 h-32 text-rose-400 opacity-80" />
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Special Dates Section -->
    <section id="datas-especiais" class="py-16 bg-gradient-to-b from-rose-50 to-white relative">
        <div class="max-w-5xl mx-auto px-4">
            <div class="bg-rose-400 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl" data-aos="flip-up">
                
                <HeartIcon class="absolute -top-10 -right-10 w-40 h-40 text-rose-500 opacity-20 fill-rose-500 transform rotate-12" />
                <GiftIcon class="absolute -bottom-5 -left-5 w-32 h-32 text-rose-300 opacity-30 transform -rotate-12" />
                
                <div class="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div class="md:w-2/3 text-center md:text-left">
                        <div class="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 mb-4 border border-white/30 text-sm font-semibold uppercase tracking-wider">
                            Datas Especiais
                        </div>
                        <h2 class="font-display text-4xl md:text-5xl font-bold mb-4">Presenteie com Afeto!</h2>
                        <p class="text-rose-100 text-lg mb-6 leading-relaxed">
                            Dia dos Namorados chegando? Aniversário de alguém especial? 
                            Surpreenda com uma peça única, feita à mão. Criamos amigurumis, corações em crochê, e kits personalizados para emocionar quem você ama.
                        </p>
                        <button @click="openWhatsApp('Olá Laurinha! Preciso de um presente especial/personalizado para uma data comemorativa!')" class="bg-white text-rose-500 hover:bg-rose-50 px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-transform transform hover:scale-105 inline-flex items-center gap-2">
                            <GiftIcon class="w-5 h-5" />
                            Quero um Presente Único
                        </button>
                    </div>
                    <div class="md:w-1/3 flex justify-center">
                        <div class="w-48 h-48 bg-white/20 backdrop-blur-md rounded-full border-4 border-white/50 flex items-center justify-center animate-pulse-slow">
                            <HeartHandshakeIcon class="w-24 h-24 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Products Section -->
    <section id="produtos" class="py-20 bg-white relative">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-16" data-aos="fade-up">
                <h2 class="font-display text-4xl font-bold text-gray-800 mb-4">O que a Laurinha faz?</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Tudo o que a tua imaginação permitir! Escolhe o teu favorito.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                
                <div @click="openWhatsApp('Oi Laurinha! Gostei muito das Tiaras/Faixas e queria encomendar.')" class="bg-rose-50 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-rose-200 hover:-translate-y-2 cursor-pointer" data-aos="fade-up" data-aos-delay="100">
                    <div class="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <CrownIcon class="w-8 h-8 text-rose-400" />
                    </div>
                    <h3 class="font-display text-2xl font-bold text-gray-800 mb-2">Tiaras e Faixas</h3>
                    <p class="text-gray-600 text-sm mb-4">Acessórios fofos e confortáveis. Em todas as cores!</p>
                    <span class="text-rose-500 font-bold text-sm flex items-center justify-center gap-1"><MessageCircleIcon class="w-4 h-4" /> Pedir</span>
                </div>

                <div @click="openWhatsApp('Oi Laurinha! Quero encomendar um Top/Cropped maravilhoso!')" class="bg-teal-50 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-teal-200 hover:-translate-y-2 cursor-pointer" data-aos="fade-up" data-aos-delay="200">
                    <div class="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <ShirtIcon class="w-8 h-8 text-teal-400" />
                    </div>
                    <h3 class="font-display text-2xl font-bold text-gray-800 mb-2">Tops e Croppeds</h3>
                    <p class="text-gray-600 text-sm mb-4">Modelos exclusivos ajustados ao teu corpo.</p>
                    <span class="text-teal-500 font-bold text-sm flex items-center justify-center gap-1"><MessageCircleIcon class="w-4 h-4" /> Pedir</span>
                </div>

                <div @click="openWhatsApp('Oi Laurinha! Quero uma Touca/Gorro bem quentinho.')" class="bg-blue-50 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 hover:-translate-y-2 cursor-pointer" data-aos="fade-up" data-aos-delay="300">
                    <div class="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <SnowflakeIcon class="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 class="font-display text-2xl font-bold text-gray-800 mb-2">Toucas e Gorros</h3>
                    <p class="text-gray-600 text-sm mb-4">Para ficares quentinha com muito estilo!</p>
                    <span class="text-blue-500 font-bold text-sm flex items-center justify-center gap-1"><MessageCircleIcon class="w-4 h-4" /> Pedir</span>
                </div>

                <div @click="openWhatsApp('Oi Laurinha! Amei as bolsinhas, quero encomendar uma.')" class="bg-yellow-50 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-yellow-200 hover:-translate-y-2 cursor-pointer" data-aos="fade-up" data-aos-delay="400">
                    <div class="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <ShoppingBagIcon class="w-8 h-8 text-yellow-500" />
                    </div>
                    <h3 class="font-display text-2xl font-bold text-gray-800 mb-2">Bolsinhas</h3>
                    <p class="text-gray-600 text-sm mb-4">Nécessaires e bolsinhas super charmosas.</p>
                    <span class="text-yellow-600 font-bold text-sm flex items-center justify-center gap-1"><MessageCircleIcon class="w-4 h-4" /> Pedir</span>
                </div>

                <div @click="openWhatsApp('Oi Laurinha! Tenho uma ideia super específica para um item personalizado!')" class="bg-purple-50 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200 hover:-translate-y-2 cursor-pointer sm:col-span-2 lg:col-span-2" data-aos="fade-up" data-aos-delay="500">
                    <div class="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <PaletteIcon class="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 class="font-display text-2xl font-bold text-gray-800 mb-2">Itens 100% Personalizados</h3>
                    <p class="text-gray-600 mb-4 max-w-md mx-auto">Tens uma ideia na cabeça? Nós fazemos acontecer com agulhas e fios. Seja o que for!</p>
                    <span class="text-purple-500 font-bold text-sm flex items-center justify-center gap-1"><MessageCircleIcon class="w-4 h-4" /> Falar sobre a minha ideia</span>
                </div>

            </div>
        </div>
    </section>

    <!-- Feedbacks Section -->
    <section v-if="feedbacks.length > 0" id="depoimentos" class="py-20 bg-rose-50 relative">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-16" data-aos="fade-up">
                <h2 class="font-display text-4xl font-bold text-gray-800 mb-4">O que dizem sobre o Ateliê?</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Muito amor em cada pontinho, e muito amor de quem recebe!</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div v-for="(feedback, index) in feedbacks" :key="feedback.id" class="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative border border-rose-100" data-aos="fade-up" :data-aos-delay="index * 100">
                    <div class="absolute -top-6 -left-6 bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center">
                        <MessageCircleIcon class="w-6 h-6 text-rose-500" />
                    </div>
                    <p class="italic text-gray-700 text-lg mb-6 relative z-10 leading-relaxed">"{{ feedback.comment }}"</p>
                    <div class="flex items-center gap-4 mt-auto">
                        <div class="w-12 h-12 bg-rose-200 rounded-full overflow-hidden flex-shrink-0">
                            <img :src="`https://ui-avatars.com/api/?name=${feedback.customerName}&background=fca5a5&color=fff`" alt="Avatar" class="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p class="font-bold text-gray-900">{{ feedback.customerName }}</p>
                            <p class="text-xs text-rose-500 font-medium uppercase tracking-wide">{{ feedback.productName }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- WhatsApp Form Section -->
    <section id="contato" class="py-20 bg-atelie-light relative">
        <div class="max-w-4xl mx-auto px-4 relative z-10">
            <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-rose-100 flex flex-col md:flex-row" data-aos="zoom-in">
                
                <div class="bg-rose-100 p-10 md:w-2/5 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div class="absolute -top-10 -left-10 w-40 h-40 bg-rose-200 rounded-full mix-blend-multiply opacity-50 blur-xl"></div>
                    
                    <div class="w-32 h-32 bg-white rounded-full p-2 shadow-md mb-6 relative z-10">
                        <img src="https://ui-avatars.com/api/?name=Laurinha&background=fca5a5&color=fff&size=128&rounded=true" alt="Avatar Laurinha" class="w-full h-full rounded-full" />
                    </div>
                    <h3 class="font-display text-2xl font-bold text-gray-800 mb-2 relative z-10">Olá, sou a Laurinha!</h3>
                    <p class="text-gray-700 mb-6 relative z-10">Basta escolheres o que queres, mandares mensagem e conversamos no WhatsApp!</p>
                    
                    <div class="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full relative z-10">
                        <MessageCircleIcon class="w-5 h-5" />
                        Resposta Rápida
                    </div>
                </div>

                <div class="p-10 md:w-3/5">
                    <h3 class="font-display text-3xl font-bold text-gray-800 mb-2">Monta o teu pedido</h3>
                    <p class="text-gray-500 mb-6 text-sm">Preenche abaixo e envia direto para o meu WhatsApp.</p>
                    
                    <form @submit.prevent="buildAndSendWhatsApp" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-600 mb-1">O teu Nome</label>
                            <input v-model="wpName" type="text" placeholder="Como te chamas?" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-600 mb-1">O que queres encomendar?</label>
                            <select v-model="wpProduct" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all bg-white">
                                <option value="uma Tiara/Faixa">Uma Tiara/Faixa</option>
                                <option value="um Top/Cropped">Um Top/Cropped</option>
                                <option value="uma Touca/Gorro">Uma Touca/Gorro</option>
                                <option value="uma Bolsinha">Uma Bolsinha</option>
                                <option value="um Presente Especial (Dia dos Namorados, etc)">Presente Especial (Ex: Dia dos Namorados)</option>
                                <option value="um Item Personalizado diferente">Outro Item Personalizado</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-600 mb-1">Detalhes (Cores, tamanho, ideia...)</label>
                            <textarea v-model="wpDetails" rows="3" placeholder="Conta-me como imaginas a peça..." class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"></textarea>
                        </div>
                        <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-200 flex justify-center items-center gap-2 transform hover:-translate-y-1">
                            <SendIcon class="w-5 h-5" />
                            Enviar para o WhatsApp
                        </button>
                    </form>
                </div>

            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white pt-16 pb-8 border-t border-rose-100">
        <div class="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-2">
                <ScissorsIcon class="text-rose-400 w-6 h-6" />
                <span class="font-display font-semibold text-xl text-gray-800">Ateliê da Laurinha</span>
            </div>
            
            <p class="text-gray-500 text-sm text-center md:text-left">
                &copy; 2026 Ateliê da Laurinha. Todos os direitos reservados. Feito com <HeartIcon class="w-4 h-4 inline text-rose-500 fill-rose-500" />.
            </p>
            <router-link to="/admin" class="text-xs text-gray-400 hover:text-rose-400 transition-colors">Área Admin</router-link>
        </div>
    </footer>
  </div>
</template>

<style scoped>
</style>
