import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', component: () => import('./views/HomeView.vue') },
  { path: '/login', component: () => import('./views/LoginView.vue') },
  { 
    path: '/admin', 
    component: () => import('./views/AdminView.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: () => import('./components/admin/Dashboard.vue') },
      { path: 'finances', component: () => import('./components/admin/Finances.vue') },
      { path: 'production-log', component: () => import('./components/admin/ProductionLog.vue') },
      { path: 'production', component: () => import('./components/admin/Production.vue') },
      { path: 'stock', component: () => import('./components/admin/Stock.vue') },
      { path: 'calculator', component: () => import('./components/admin/Calculator.vue') },
      { path: 'orders', component: () => import('./components/admin/Orders.vue') },
      { path: 'feedbacks', component: () => import('./components/admin/Feedbacks.vue') }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('atelie_token');
    if (token === 'atelie-secret-token') {
      next();
    } else {
      next('/login');
    }
  } else {
    next();
  }
});

export { router };
