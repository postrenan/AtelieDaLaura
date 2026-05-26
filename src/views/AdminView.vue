<script setup>
import { LayoutDashboard, Receipt, Calculator, Settings, ArrowLeft, Package, Archive, Hammer, MessageSquareQuote } from '@lucide/vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();

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

const isCurrentRoute = (path) => computed(() => route.path.startsWith(path)).value;
const handleLogout = () => {
    localStorage.removeItem('atelie_token');
    router.push('/login');
};
</script>

<template>
  <div class="flex h-screen bg-atelie-light font-sans">
    
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-rose-100 shadow-sm flex flex-col">
      <div class="p-6 border-b border-rose-50 flex items-center gap-3">
        <div class="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
          <span class="font-display font-bold text-rose-600 text-xl">L</span>
        </div>
        <h2 class="text-xl font-display font-bold text-gray-800">Painel Admin</h2>
      </div>
      
      <nav class="flex-1 p-4 overflow-y-auto space-y-6">
        <div v-for="group in navigationGroups" :key="group.title">
          <h3 class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                  ? 'bg-rose-50 text-rose-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4" />
              {{ item.name }}
            </router-link>
          </div>
        </div>
      </nav>

      <div class="p-4 border-t border-rose-50 space-y-2">
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 transition-colors">
            Sair do Sistema
        </button>
        <router-link to="/" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowLeft class="w-5 h-5" />
          Voltar ao Site
        </router-link>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <main class="flex-1 overflow-y-auto bg-gray-50 p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
