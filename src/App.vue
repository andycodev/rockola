<template>
  <component>
    <router-view />
  </component>

  <!-- Componentes globales -->
  <div class="fixed inset-0 pointer-events-none z-[999] flex items-center justify-center">
    <div class="pointer-events-auto">
      <Notification v-bind="notificationState" @close="notificationState.show = false" />
    </div>
  </div>

  <Loading />
</template>

<script lang="ts" setup>
import Notification from './components/shared/Notification.vue'
import { notificationState } from './events/notificationEvents'
</script>

<style scoped>
/* Estilos opcionales para transiciones suaves entre rutas */
.flex-1 {
  transition: all 0.2s ease-in-out;
}
</style>