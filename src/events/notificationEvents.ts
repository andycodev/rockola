import { ref } from 'vue'

// Estado global de notificaciones
export const notificationState = ref({
  message: '',
  type: 'alert-info',
  show: false
})

// Función para mostrar notificaciones
export const showNotification = (message: string, type: 'alert-success' | 'alert-error' | 'alert-warning' | 'alert-info' = 'alert-info') => {
  notificationState.value = {
    message,
    type,
    show: true
  }
}

// Función para ocultar notificaciones
export const hideNotification = () => {
  notificationState.value.show = false
}
