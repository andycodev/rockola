<template>
    <div class="admin-panel">
        <header class="admin-header">
            <h1 class="logo-text">⚙️ PANEL <span>ADMIN</span></h1>
            <button class="btn-refresh" @click="cargarDatosAdmin">🔄</button>
        </header>

        <!-- Navegación por Pestañas (Sticky) -->
        <nav class="admin-tabs">
            <button :class="{ active: tabActiva === 'musica' }" @click="tabActiva = 'musica'">
                🎵 Música <span v-if="canciones.length" class="dot-count">{{ canciones.length }}</span>
            </button>
            <button :class="{ active: tabActiva === 'mesas' }" @click="tabActiva = 'mesas'">
                🏠 Mesas
            </button>
        </nav>

        <main class="admin-content">
            <!-- TAB: GESTIÓN DE MÚSICA -->
            <section v-show="tabActiva === 'musica'" class="tab-section animate-in">
                <!-- Monitor en Vivo (Sincronizado) -->
                <div class="monitor-card">
                    <h2 class="section-title">📺 Monitor en Vivo</h2>
                    <div class="monitor-container" :class="{ 'is-empty': !cancionSonando }">
                        <div class="player-wrapper">
                            <div id="admin-player"></div>
                            <div v-if="!cancionSonando" class="player-placeholder">
                                <span>Sincronizando con TV...</span>
                            </div>
                        </div>
                        <div class="monitor-info" v-if="cancionSonando">
                            <div class="playing-tag">EN VIVO</div>
                            <h3 class="truncate-text">{{ cancionSonando.titulo }}</h3>
                            <p class="mesa-name">Mesa: {{ obtenerNombreMesa(cancionSonando.mesa_id) }}</p>
                            <button class="btn-skip-monitor" @click="saltarTemaActual">
                                Saltar Tema ⏭️
                            </button>
                        </div>
                        <div class="monitor-info" v-else>
                            <p class="no-play-msg">No hay música sonando ahora.</p>
                        </div>
                    </div>
                </div>

                <div class="seccion-listas">
                    <h2 class="section-title">Cola de Reproducción</h2>
                    <div v-if="canciones.length === 0" class="empty-msg">No hay canciones en espera.</div>
                    <div v-for="item in canciones" :key="item.id" class="item-cancion" :class="item.estado">
                        <img :src="item.miniatura" />
                        <div class="detalles">
                            <h4 class="truncate-text">{{ item.titulo }}</h4>
                            <p class="meta">
                                <span :class="['badge-status', item.estado]">
                                    {{ item.estado === 'reproduciendo' ? 'SONANDO' : 'EN COLA' }}
                                </span>
                                <strong>{{ obtenerNombreMesa(item.mesa_id) }}</strong>
                            </p>
                        </div>
                        <button v-if="item.estado !== 'reproduciendo'" class="btn-delete"
                            @click="quitarCancion(item.id)">
                            ✕
                        </button>
                    </div>

                    <h2 class="section-title mt-8">Historial Reciente</h2>
                    <div v-for="item in historialAdmin" :key="item.id" class="item-cancion historial">
                        <img :src="item.miniatura" class="grayscale opacity-50" />
                        <div class="detalles">
                            <h4 class="text-slate-400 truncate-text">{{ item.titulo }}</h4>
                            <p class="meta">
                                <span class="badge-status completada">{{ item.estado.toUpperCase() }}</span>
                                {{ obtenerNombreMesa(item.mesa_id) }}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TAB: ESTRUCTURA DE MESAS -->
            <section v-show="tabActiva === 'mesas'" class="tab-section animate-in">
                <div class="seccion-mesas">
                    <h2 class="section-title">Crear Mesa</h2>
                    <div class="crear-mesa-box">
                        <input v-model="nuevaMesaNombre" placeholder="Ej: Mesa 05" @keyup.enter="crearMesa" />
                        <button @click="crearMesa" :disabled="!nuevaMesaNombre.trim()">+</button>
                    </div>

                    <div class="mesas-grid">
                        <div v-for="mesa in mesas" :key="mesa.id" class="card-mesa">
                            <div class="mesa-header">
                                <h3 class="text-orange-500 font-black">{{ mesa.numero_mesa }}</h3>
                                <div class="pin-box">
                                    <span class="pin-masked">
                                        PIN: <span class="pin-value">{{ mesa.pin }}</span>
                                    </span>
                                    <button @click="regenerarPin(mesa)" class="btn-mini-pin">🔄</button>
                                </div>
                            </div>
                            <div class="qr-container">
                                <qrcode-vue :value="obtenerUrlQR(mesa.id)" :size="110" level="H" background="#ffffff" />
                            </div>
                            <button class="btn-clear" @click="limpiarMesa(mesa)">Limpiar Sesión</button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { supabase } from '../lib/supabaseClient'
import QrcodeVue from 'qrcode.vue'
import type { Mesa, Cancion } from '../types/rockola'

const mesas = ref<Mesa[]>([])
const canciones = ref<Cancion[]>([])
const historialAdmin = ref<Cancion[]>([])
const nuevaMesaNombre = ref('')
const tabActiva = ref<'musica' | 'mesas'>('musica')
const player = ref<any>(null)

const cancionSonando = computed(() => {
    return canciones.value.find(c => c.estado === 'reproduciendo')
})

const cargarDatosAdmin = async () => {
    const { data: m } = await supabase.from('mesas').select('*').order('numero_mesa', { ascending: true })
    console.log("Mesas cargadas:", m)
    mesas.value = m || []

    // Cargar cola activa
    const { data: c } = await supabase
        .from('cola_reproduccion')
        .select('*')
        .in('estado', ['pendiente', 'reproduciendo'])
        .order('id', { ascending: true })
    canciones.value = c || []

    // Cargar historial para el admin
    const { data: h } = await supabase
        .from('cola_reproduccion')
        .select('*')
        .in('estado', ['completada', 'saltada'])
        .order('id', { ascending: false })
        .limit(10)
    historialAdmin.value = h || []
}

// Crear una nueva mesa en el sistema
const crearMesa = async () => {
    if (!nuevaMesaNombre.value.trim()) return
    const { error } = await supabase.from('mesas').insert([{
        numero_mesa: nuevaMesaNombre.value,
        pin: Math.floor(100 + Math.random() * 900).toString() // Genera PIN de 3 dígitos
    }])
    if (error) alert('Error al crear mesa o nombre ya existe.')
    else {
        nuevaMesaNombre.value = ''
        cargarDatosAdmin()
    }
}

const obtenerNombreMesa = (id: string) => {
    const mesa = mesas.value.find(m => m.id === id)
    return mesa ? mesa.numero_mesa : '...'
}

// Sincronización del reproductor
watch(cancionSonando, (newVal) => {
    if (newVal && player.value && player.value.loadVideoById) {
        player.value.loadVideoById(newVal.youtube_video_id)
    } else if (!newVal && player.value && player.value.stopVideo) {
        player.value.stopVideo()
    }
})

const regenerarPin = async (mesa: Mesa) => {
    const nuevoPin = Math.floor(100 + Math.random() * 900).toString()
    try {
        const { error } = await supabase.from('mesas').update({ pin: nuevoPin }).eq('id', mesa.id)
        if (error) throw error
        cargarDatosAdmin()
    } catch (err) {
        console.error("Error al regenerar PIN:", err)
    }
}

// Opción 3: Limpiar mesa y cambiar el token remoto para desvincular intrusos
const limpiarMesa = async (mesa: Mesa) => {
    if (!mesa?.id) return
    if (!confirm(`¿Limpiar la ${mesa.numero_mesa}? Se invalidarán los accesos actuales y se cancelarán pedidos pendientes.`)) return

    const nuevoToken = crypto.randomUUID()
    const nuevoPin = Math.floor(100 + Math.random() * 900).toString()

    try {
        // 1. Cambiamos el token y el PIN para expulsar sesiones viejas
        await supabase.from('mesas').update({
            token_actual: nuevoToken,
            pin: nuevoPin
        }).eq('id', mesa.id)

        // 2. Cancelamos los pedidos pendientes de ESTA mesa solamente
        await supabase.from('cola_reproduccion')
            .update({ estado: 'saltada' })
            .eq('mesa_id', mesa.id)
            .eq('estado', 'pendiente')

        alert(`Mesa ${mesa.numero_mesa} renovada con éxito.`)
    } catch (err) {
        console.error("Error al limpiar mesa:", err)
    }

    cargarDatosAdmin()
}

const saltarTemaActual = async () => {
    if (!cancionSonando.value) return
    await supabase.from('cola_reproduccion').update({ estado: 'saltada' }).eq('id', cancionSonando.value.id)
    cargarDatosAdmin()
}

const quitarCancion = async (id: number) => {
    await supabase.from('cola_reproduccion').delete().eq('id', id)
    cargarDatosAdmin()
}

// Obtener el enlace del QR estático limpio
const obtenerUrlQR = (id: string) => {
    // Cambia localhost por la URL definitiva cuando despliegues la app
    return `${window.location.origin}/mesa/${id}`
}

let channel: any = null
let mesasChannel: any = null

onMounted(() => {
    cargarDatosAdmin()

    // Cargar API de YouTube
    if (!(window as any).YT) {
        const tag = document.createElement('script')
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initYT = () => {
        player.value = new (window as any).YT.Player('admin-player', {
            height: '100%',
            width: '100%',
            playerVars: { 'autoplay': 1, 'controls': 1, 'mute': 1 },
            events: {
                'onReady': () => {
                    if (cancionSonando.value) player.value.loadVideoById(cancionSonando.value.youtube_video_id)
                }
            }
        })
    }

    if ((window as any).YT && (window as any).YT.Player) {
        initYT()
    } else {
        (window as any).onYouTubeIframeAPIReady = initYT
    }

    channel = supabase
        .channel('admin-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => {
            cargarDatosAdmin()
        })
        .subscribe()

    mesasChannel = supabase
        .channel('queue-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_reproduccion' }, () => {
            cargarDatosAdmin()
        })
        .subscribe()
})

onUnmounted(() => {
    if (channel) supabase.removeChannel(channel)
    if (mesasChannel) supabase.removeChannel(mesasChannel)
})
</script>

<style scoped>
.admin-panel {
    background: #0a0f1e;
    color: #f8fafc;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
}

.admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: #111827;
    border-bottom: 1px solid #1e293b;
}

.logo-text {
    font-size: 18px;
    font-weight: 900;
}

.logo-text span {
    color: #3b82f6;
}

.btn-refresh {
    background: #1e293b;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
}

/* Tabs Estilo PWA */
.admin-tabs {
    display: flex;
    background: #111827;
    padding: 5px;
    position: sticky;
    top: 0;
    z-index: 40;
    border-bottom: 1px solid #1e293b;
}

.admin-tabs button {
    flex: 1;
    padding: 12px;
    background: transparent;
    border: none;
    color: #64748b;
    font-weight: 800;
    font-size: 13px;
    text-transform: uppercase;
    position: relative;
    cursor: pointer;
}

.admin-tabs button.active {
    color: #3b82f6;
}

.admin-tabs button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    right: 20%;
    height: 3px;
    background: #3b82f6;
    border-radius: 10px 10px 0 0;
}

.dot-count {
    background: #ef4444;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 5px;
}

.admin-content {
    padding: 15px;
}

/* Monitor Card */
.monitor-card {
    background: #000;
    border-radius: 15px;
    padding: 15px;
    margin-bottom: 20px;
    border: 1px solid #1e293b;
}

.monitor-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
}

@media (min-width: 768px) {
    .monitor-container {
        grid-template-columns: 250px 1fr;
    }
}

.player-wrapper {
    width: 100%;
    aspect-ratio: 16/9;
    background: #111;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.player-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    font-size: 12px;
    background: #111;
}

.monitor-info {
    margin-top: 12px;
}

.playing-tag {
    display: inline-block;
    background: #ef4444;
    font-size: 10px;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: 4px;
    margin-bottom: 5px;
}

.btn-skip-monitor {
    width: 100%;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 10px;
    font-weight: 800;
    margin-top: 10px;
}

/* Estilos generales de secciones y items */
.section-title {
    font-size: 14px;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 15px;
    letter-spacing: 1px;
}

.crear-mesa-box {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
}

.crear-mesa-box input {
    flex: 1;
    background: #111827;
    border: 1px solid #1e293b;
    padding: 12px;
    border-radius: 10px;
    color: white;
}

.crear-mesa-box button {
    background: #10b981;
    color: white;
    border: none;
    padding: 0 20px;
    border-radius: 10px;
    font-size: 20px;
}

.mesas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
}

.card-mesa {
    background: #111827;
    border: 1px solid #1e293b;
    padding: 15px;
    border-radius: 15px;
    text-align: center;
}

.mesa-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}

.pin-box {
    text-align: right;
}

.pin-value {
    filter: blur(4px);
    transition: 0.3s;
}

.pin-masked:active .pin-value {
    filter: blur(0);
}

.btn-mini-pin {
    background: none;
    border: none;
    font-size: 10px;
    cursor: pointer;
    opacity: 0.5;
}

.qr-container {
    background: white;
    padding: 8px;
    border-radius: 8px;
    display: inline-block;
    margin-bottom: 10px;
}

.btn-clear {
    width: 100%;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
}

.item-cancion {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #111827;
    border-radius: 12px;
    margin-bottom: 8px;
    border: 1px solid #1e293b;
}

.item-cancion img {
    width: 45px;
    height: 45px;
    border-radius: 6px;
    object-fit: cover;
}

.detalles {
    flex: 1;
    min-width: 0;
}

.detalles h4 {
    font-size: 13px;
    margin-bottom: 4px;
    font-weight: 600;
}

.meta {
    font-size: 10px;
    color: #64748b;
}

.badge-status {
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 800;
    margin-right: 8px;
}

.badge-status.reproduciendo {
    background: #10b981;
    color: white;
}

.badge-status.pendiente {
    background: #334155;
    color: #94a3b8;
}

.badge-status.completada {
    background: #1e293b;
    color: #475569;
}

.btn-delete {
    background: none;
    border: none;
    color: #ef4444;
    font-size: 18px;
    padding: 5px;
}

.truncate-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.empty-msg {
    text-align: center;
    color: #475569;
    padding: 20px;
    font-size: 13px;
}

.grayscale {
    filter: grayscale(1);
}

.animate-in {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>