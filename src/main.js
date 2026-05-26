import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import AOS from 'aos'
import 'aos/dist/aos.css'

const app = createApp(App)

app.use(router)

app.mount('#app')

// Initialize AOS after mounting
AOS.init({
    once: true,
    offset: 50,
    duration: 800,
})
