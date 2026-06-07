import { createRouter, createWebHistory } from 'vue-router'
import MesaView from '@/views/MesaView.vue'
import TvView from '@/views/TvView.vue'
import AdminView from '@/views/AdminView.vue'

const routes = [
  {
    path: '/',
    redirect: '/tv',
  },
  {
    path: '/mesa/:id',
    name: 'mesa-cliente',
    component: MesaView
  },
  {
    path: '/tv',
    name: 'pantalla-tv',
    component: TvView
  },
  {
    path: '/admin',
    name: 'administracion',
    component: AdminView
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/tv',
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router