import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
            enabled: true,
        },
    },
});

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount('#app')