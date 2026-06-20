<script setup>
import {
  LayoutDashboard, Receipt, Calculator, Settings, ArrowLeft,
  Package, Archive, Hammer, MessageSquareQuote, ShoppingBag,
  Menu, X
} from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';

const route = useRoute();
const router = useRouter();
const showMobileMenu = ref(false);

const navigationGroups = [
  {
    title: 'Visão Geral',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Produção & Estoque',
    items: [
      { name: 'Registro Diário', href: '/admin/production-log', icon: Hammer },
      { name: 'Materiais (Insumos)', href: '/admin/production', icon: Settings },
      { name: 'Estoque (Pronta Entrega)', href: '/admin/stock', icon: Archive },
    ]
  },
  {
    title: 'Vendas & Clientes',
    items: [
      { name: 'Produtos (Site)', href: '/admin/products', icon: ShoppingBag },
      { name: 'Encomendas', href: '/admin/orders', icon: Package },
      { name: 'Feedbacks', href: '/admin/feedbacks', icon: MessageSquareQuote },
    ]
  },
  {
    title: 'Gestão Administrativa',
    items: [
      { name: 'Finanças', href: '/admin/finances', icon: Receipt },
      { name: 'Calculadora', href: '/admin/calculator', icon: Calculator },
    ]
  }
];

const footerNavPrimary = [
  { name: 'Início', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Produção', href: '/admin/production-log', icon: Hammer },
  { name: 'Produtos', href: '/admin/products', icon: ShoppingBag },
  { name: 'Finanças', href: '/admin/finances', icon: Receipt },
];

const handleLogout = () => {
  localStorage.removeItem('alma_token');
  showMobileMenu.value = false;
  router.push('/login');
};
</script>

<template>
  <div class="flex h-screen bg-alma-cream font-sans">

    <!-- Sidebar (desktop only) -->
    <aside class="hidden md:flex w-64 bg-white border-r border-alma-light shadow-sm flex-col flex-shrink-0">
      <div class="p-6 border-b border-alma-light/50 flex items-center gap-3">
        <img src="/Semfundomonograma.png" alt="AT" class="w-10 h-10 object-contain" />
        <h2 class="text-xl font-display font-bold text-alma-brown">Painel Admin</h2>
      </div>

      <nav class="flex-1 p-4 overflow-y-auto space-y-6">
        <div v-for="group in navigationGroups" :key="group.title">
          <h3 class="px-4 text-xs font-semibold text-alma-text/50 uppercase tracking-wider mb-2">
            {{ group.title }}
          </h3>
          <div class="space-y-1">
            <router-link
              v-for="item in group.items"
              :key="item.name"
              :to="item.href"
              class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
              :class="[
                route.path === item.href
                  ? 'bg-alma-light text-alma-brown shadow-sm'
                  : 'text-alma-text hover:bg-alma-cream hover:text-alma-brown'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4" />
              {{ item.name }}
            </router-link>
          </div>
        </div>
      </nav>

      <div class="p-4 border-t border-alma-light/50 space-y-2">
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 transition-colors">
          Sair do Sistema
        </button>
        <router-link to="/" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-alma-text hover:bg-alma-cream transition-colors">
          <ArrowLeft class="w-5 h-5" />
          Voltar ao Site
        </router-link>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">

      <!-- Mobile top bar -->
      <div class="md:hidden bg-white border-b border-alma-light px-4 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
        <img src="/Semfundomonograma.png" alt="Alma Tramada" class="w-8 h-8 object-contain" />
        <span class="font-display font-bold text-alma-brown text-sm">Painel Admin</span>
        <button @click="showMobileMenu = true" class="text-alma-text p-1">
          <Menu class="w-6 h-6" />
        </button>
      </div>

      <main class="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 pb-24 md:pb-8">
        <router-view />
      </main>
    </div>

    <!-- Mobile bottom footer nav -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-alma-light z-40 flex safe-area-bottom">
      <router-link
        v-for="item in footerNavPrimary"
        :key="item.href"
        :to="item.href"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
        :class="route.path === item.href ? 'text-alma-brown' : 'text-alma-text/40 hover:text-alma-text'"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-[10px] font-medium leading-none">{{ item.name }}</span>
      </router-link>
      <button
        @click="showMobileMenu = true"
        class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-alma-text/40"
      >
        <Menu class="w-5 h-5" />
        <span class="text-[10px] font-medium leading-none">Mais</span>
      </button>
    </nav>

    <!-- Mobile slide-up menu overlay -->
    <Transition name="overlay">
      <div v-if="showMobileMenu" class="md:hidden fixed inset-0 z-50 bg-black/50" @click="showMobileMenu = false">
        <Transition name="slide-up">
          <div
            v-if="showMobileMenu"
            class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
            @click.stop
          >
            <!-- Handle bar -->
            <div class="flex justify-center pt-3 pb-1">
              <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div class="flex items-center justify-between px-5 py-3 border-b border-alma-light">
              <span class="font-display font-bold text-alma-brown text-lg">Menu</span>
              <button @click="showMobileMenu = false" class="text-alma-text/50 hover:text-alma-text">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="overflow-y-auto flex-1 p-4 space-y-5">
              <div v-for="group in navigationGroups" :key="group.title">
                <h3 class="text-xs font-semibold text-alma-text/40 uppercase tracking-wider mb-2 px-2">
                  {{ group.title }}
                </h3>
                <div class="space-y-1">
                  <router-link
                    v-for="item in group.items"
                    :key="item.name"
                    :to="item.href"
                    @click="showMobileMenu = false"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                    :class="route.path === item.href ? 'bg-alma-light text-alma-brown' : 'text-alma-text hover:bg-alma-cream'"
                  >
                    <component :is="item.icon" class="w-4 h-4" />
                    {{ item.name }}
                  </router-link>
                </div>
              </div>
            </div>

            <div class="p-4 border-t border-alma-light space-y-1 pb-8">
              <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                Sair do Sistema
              </button>
              <router-link to="/" @click="showMobileMenu = false" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-alma-text hover:bg-alma-cream transition-colors">
                <ArrowLeft class="w-5 h-5" />
                Voltar ao Site
              </router-link>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.slide-up-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-leave-active { transition: transform 0.25s ease-in; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>
