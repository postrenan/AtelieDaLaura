<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Lock, User, AlertCircle } from '@lucide/vue';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
    isLoading.value = true;
    error.value = '';
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.value, password: password.value })
        });
        
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('atelie_token', data.token);
            router.push('/admin/dashboard');
        } else {
            error.value = 'Usuário ou senha incorretos.';
        }
    } catch (e) {
        error.value = 'Erro ao conectar com o servidor.';
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen bg-atelie-light flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        
        <!-- Decorative blobs -->
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-atelie-pink rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-atelie-blue rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style="animation-delay: 1s;"></div>
        
        <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
            <h2 class="mt-6 text-center text-4xl font-display font-extrabold text-gray-900 tracking-tight">
                Área Restrita
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
                Acesso exclusivo para a administração do Ateliê.
            </p>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
            <div class="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl shadow-rose-500/10 sm:rounded-3xl sm:px-10 border border-white/40">
                <form class="space-y-6" @submit.prevent="handleLogin">
                    
                    <div v-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                        <AlertCircle class="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                        <p class="text-sm text-red-700">{{ error }}</p>
                    </div>

                    <div>
                        <label for="username" class="block text-sm font-medium text-gray-700">
                            Usuário
                        </label>
                        <div class="mt-1 relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User class="h-5 w-5 text-gray-400" />
                            </div>
                            <input id="username" name="username" type="text" required v-model="username"
                                class="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm bg-white/50"
                                placeholder="Digite seu usuário">
                        </div>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700">
                            Senha
                        </label>
                        <div class="mt-1 relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock class="h-5 w-5 text-gray-400" />
                            </div>
                            <input id="password" name="password" type="password" required v-model="password"
                                class="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm bg-white/50"
                                placeholder="••••••••">
                        </div>
                    </div>

                    <div>
                        <button type="submit" :disabled="isLoading"
                            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
                            {{ isLoading ? 'Entrando...' : 'Entrar' }}
                        </button>
                    </div>
                </form>
                
                <div class="mt-6 text-center">
                    <router-link to="/" class="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors">
                        ← Voltar para a Loja
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>
