<template>
    <div class="tv-container">
        <header class="tv-header">
            <div class="logo">🎶 ROCKOLA <span>LIVE</span></div>
            <div class="status-bar" v-if="cancionActual">
                Estás escuchando: <strong>{{ cancionActual.titulo }}</strong>
            </div>
        </header>

        <div class="main-layout">
            <!-- Zona del Reproductor -->
            <section class="player-section">
                <div class="reproductor-box">
                    <div id="player"></div>
                    <div class="empty-state" v-if="!cancionActual">
                        <div class="icon">📻</div>
                        <p>¡Cola vacía!</p>
                        <span>Escanea el QR de tu mesa y pide un tema.</span>
                    </div>
                </div>
            </section>

            <!-- Zona de la Cola -->
            <aside class="queue-section">
                <h3>Próximos Temas</h3>
                <div class="lista-espera">
                    <TransitionGroup name="list">
                        <div v-for="(cancion, index) in cola" :key="cancion.id" class="queue-item">
                            <span class="index">#{{ index + 1 }}</span>
                            <img :src="cancion.miniatura" class="thumb" />
                            <div class="details">
                                <p class="title">{{ cancion.titulo }}</p>
                                <p class="mesa">Pedido desde: {{ obtenerNombreMesa(cancion.mesa_id) }}</p>
                            </div>
                        </div>
                    </TransitionGroup>
                    <div v-if="cola.length === 0" class="no-songs">
                        Esperando pedidos...
                    </div>
                </div>
            </aside>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import type { Cancion } from '../types/rockola'
const cancionActual = ref<Cancion | null>(null)
const cola = ref<Cancion[]>([])
const mesas = ref<any[]>([])
let player: any = null
let realtimeChannel: any = null

const cargarMesas = async () => {
    const { data } = await supabase.from('mesas').select('*')
    mesas.value = data || []
}

const obtenerNombreMesa = (id: string) => {
    const m = mesas.value.find(mesa => mesa.id === id)
    return m ? m.numero_mesa : '...'
}

const cargarCola = async () => {
    const { data } = await supabase
        .from('cola_reproduccion')
        .select('*')
        .eq('estado', 'pendiente')
        .order('id', { ascending: true })
    cola.value = data || []
}

const buscarSiguienteCancion = async () => {
    await cargarCola()
    if (cola.value.length > 0) {
        reproducirVideo(cola.value[0])
    } else {
        cancionActual.value = null
    }
}

const reproducirVideo = async (cancion: Cancion) => {
    cancionActual.value = cancion
    await supabase.from('cola_reproduccion').update({ estado: 'reproduciendo' }).eq('id', cancion.id)
    if (player && player.loadVideoById) player.loadVideoById(cancion.youtube_video_id)
    await cargarCola()
}

// Limpiar canciones que se quedaron "atrapadas" en estado reproduciendo
const limpiarReproduccionesZombies = async () => {
    await supabase
        .from('cola_reproduccion')
        .update({ estado: 'completada' })
        .eq('estado', 'reproduciendo')
}

const finalizarCancion = async (estadoFinal: 'completada' | 'saltada') => {
    if (!cancionActual.value) return
    const { error } = await supabase.from('cola_reproduccion').update({ estado: estadoFinal }).eq('id', cancionActual.value.id)
    if (error) console.error("Error al finalizar canción:", error)
    await buscarSiguienteCancion()
}

onMounted(() => {
    const tag = document.createElement('script')
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

        ; (window as any).onYouTubeIframeAPIReady = () => {
            player = new (window as any).YT.Player('player', {
                height: '100%',
                width: '100%',
                playerVars: { 'autoplay': 1, 'controls': 0, 'modestbranding': 1, 'rel': 0 },
                events: {
                    'onReady': () => { buscarSiguienteCancion() },
                    'onStateChange': (e: any) => {
                        // e.data === 0 es el evento 'ENDED' (Video terminado)
                        if (e.data === 0) finalizarCancion('completada')
                    }
                }
            })
        }

    limpiarReproduccionesZombies()
    cargarMesas()
    realtimeChannel = supabase.channel('tv-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_reproduccion' }, (payload: any) => {
            if (payload.eventType === 'UPDATE') {
                const cambiado = payload.new as Cancion
                // Si el Admin saltó la canción que está sonando ahora
                if (cancionActual.value && cambiado.id === cancionActual.value.id && cambiado.estado === 'saltada') {
                    if (player && player.stopVideo) player.stopVideo()
                    buscarSiguienteCancion()
                } else {
                    cargarCola()
                }
            } else {
                cargarCola()
                if (!cancionActual.value) buscarSiguienteCancion()
            }
        }).subscribe()
})

onUnmounted(() => { if (realtimeChannel) supabase.removeChannel(realtimeChannel) })
</script>
<style scoped>
.tv-container {
    background: #0a0a0a;
    color: #e5e7eb;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
}

.tv-header {
    padding: 20px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 2px;
}

.logo span {
    color: #10b981;
}

.main-layout {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    flex: 1;
    gap: 0;
}

.player-section {
    padding: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
}

.reproductor-box {
    width: 100%;
    aspect-ratio: 16/9;
    background: #111;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    position: relative;
}

.empty-state {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.empty-state .icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
}

.queue-section {
    background: #0f172a;
    padding: 30px;
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
}

.queue-section h3 {
    font-size: 18px;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 20px;
    letter-spacing: 1px;
}

.lista-espera {
    flex: 1;
    overflow-y: auto;
}

.queue-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    margin-bottom: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.queue-item .index {
    font-weight: 800;
    color: #10b981;
    font-size: 18px;
    min-width: 30px;
}

.queue-item .thumb {
    width: 70px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
}

.queue-item .title {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.queue-item .mesa {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
}

.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}
</style>