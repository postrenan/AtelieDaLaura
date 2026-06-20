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
            localStorage.setItem('alma_token', data.token);
            router.push('/admin/dashboard');
        } else {
            error.value = 'Usuário ou senha incorretos.';
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erro ao conectar com o servidor.';
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen bg-alma-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">

        <!-- Decorative blobs -->
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-alma-rose rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-alma-sage rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style="animation-delay: 1s;"></div>

        <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center">
            <img src="/Semfundomonograma.png" alt="Alma Tramada" class="h-24 w-auto mb-4" />
            <h2 class="text-center text-4xl font-display font-bold text-alma-brown tracking-tight">
                Área Restrita
            </h2>
            <p class="mt-2 text-center text-sm text-alma-text">
                Acesso exclusivo para a administração da Alma Tramada.
            </p>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
            <div class="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-2xl shadow-alma-brown/10 sm:rounded-3xl sm:px-10 border border-alma-light/40">
                <form class="space-y-6" @submit.prevent="handleLogin">

                    <div v-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                        <AlertCircle class="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                        <p class="text-sm text-red-700">{{ error }}</p>
                    </div>

                    <div>
                        <label for="username" class="block text-sm font-medium text-alma-text">
                            Usuário
                        </label>
                        <div class="mt-1 relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User class="h-5 w-5 text-alma-rose" />
                            </div>
                            <input id="username" name="username" type="text" required v-model="username"
                                class="appearance-none block w-full pl-10 px-3 py-2 border border-alma-light rounded-lg placeholder-alma-text/40 focus:outline-none focus:ring-alma-rose focus:border-alma-rose sm:text-sm bg-white/50"
                                placeholder="Digite seu usuário">
                        </div>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-alma-text">
                            Senha
                        </label>
                        <div class="mt-1 relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock class="h-5 w-5 text-alma-rose" />
                            </div>
                            <input id="password" name="password" type="password" required v-model="password"
                                class="appearance-none block w-full pl-10 px-3 py-2 border border-alma-light rounded-lg placeholder-alma-text/40 focus:outline-none focus:ring-alma-rose focus:border-alma-rose sm:text-sm bg-white/50"
                                placeholder="••••••••">
                        </div>
                    </div>

                    <div>
                        <button type="submit" :disabled="isLoading"
                            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-alma-brown hover:bg-alma-text focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-alma-rose transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
                            {{ isLoading ? 'Entrando...' : 'Entrar' }}
                        </button>
                    </div>
                </form>

                <div class="mt-6 text-center">
                    <router-link to="/" class="text-sm font-medium text-alma-rose hover:text-alma-brown transition-colors">
                        ← Voltar para a Loja
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>
