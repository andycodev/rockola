<template>
    <div class="toast toast-top toast-end z-[9999]">
        <Transition name="notification">
            <div v-if="show" :class="['alert shadow-lg text-white', type]">
                <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        class="stroke-current shrink-0 w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{{ message }}</span>
                </div>
                <button @click="$emit('close')" class="btn btn-ghost btn-xs">✕</button>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    message: { type: String, required: true },
    type: { type: String, default: 'alert-info' }, // alert-success, alert-error, etc.
    duration: { type: Number, default: 3000 },
    show: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

// Watcher para cerrar automáticamente cuando 'show' pase a true
watch(() => props.show, (newVal) => {
    if (newVal) {
        setTimeout(() => {
            emit('close')
        }, props.duration)
    }
})
</script>

<style scoped>
/* Animación suave de entrada por la derecha y salida */
.notification-enter-active,
.notification-leave-active {
    transition: all 0.4s ease;
}

.notification-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.notification-leave-to {
    opacity: 0;
    transform: scale(0.9);
}
</style>