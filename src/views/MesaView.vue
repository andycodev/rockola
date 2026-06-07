<template>
    <div class="container-client" v-if="!errorSesion && !mostarLoginPin">
        <header class="client-header">
            <div class="mesa-badge">Mesa {{ mesaNombre }}</div>
            <h1 class="logo-text">ROCKOLA<span>LIVE</span></h1>
        </header>

        <!-- Bloque de búsqueda -->
        <section class="search-section" :class="{ 'disabled': cancionesPropiasActivas.length >= 2 }">
            <div class="search-box">
                <input v-model="query" @keyup.enter="buscarYoutube" placeholder="Busca tu canción..."
                    :disabled="cancionesPropiasActivas.length >= 2" />
                <button @click="buscarYoutube" :disabled="cargando || cancionesPropiasActivas.length >= 2">
                    <span v-if="!cargando">🔍</span>
                    <span v-else class="loader"></span>
                </button>
            </div>
            <p v-if="cancionesPropiasActivas.length >= 2" class="limit-msg">
                ⚠️ Límite alcanzado (2 temas). Espera a que terminen.
            </p>
        </section>

        <!-- Resultados de búsqueda -->
        <div class="search-results-container" v-if="busquedaRealizada && cancionesPropiasActivas.length < 2">
            <div class="resultados" v-if="resultados.length">
                <div v-for="video in resultados" :key="video.videoId" class="card-video" @click="validarYPedir(video)">
                    <img :src="video.thumbnail" alt="thumb" />
                    <div class="video-info">
                        <p class="video-title">{{ video.title }}</p>
                        <button class="btn-add">Añadir a la cola +</button>
                    </div>
                </div>
            </div>
            <div v-else class="no-results-msg">
                {{ esResultadosLocales ? 'No encontramos esa canción en nuestra biblioteca...' :
                    'No se encontraron resultados en YouTube...' }}
            </div>

            <button v-if="esResultadosLocales && cancionesPropiasActivas.length < 2" @click="buscarEnYoutubeAPI"
                class="btn-youtube-search">
                ¿No es lo que buscas? Buscar en YouTube 📺
            </button>
        </div>

        <!-- Fila de Reproducción Global -->
        <section class="queue-section">
            <h3 class="section-title">En Cola</h3>
            <div class="lista-cola">
                <div v-for="(cancion, index) in cola" :key="cancion.id" class="item-cancion"
                    :class="{ 'es-mia': cancion.mesa_id === mesaId, 'playing': cancion.estado === 'reproduciendo' }">
                    <span class="index">#{{ index + 1 }}</span>
                    <img :src="cancion.miniatura" class="mini-thumb" />
                    <div class="info">
                        <p class="titulo-c">{{ cancion.titulo }}</p>
                        <div class="badges">
                            <span class="tag-own" v-if="cancion.mesa_id === mesaId">★ MI MESA</span>
                            <span class="status-badge" :class="cancion.estado">
                                {{ cancion.estado === 'reproduciendo' ? 'SONANDO AHORA' : 'EN COLA' }}
                            </span>
                        </div>
                    </div>
                    <!-- Botón para eliminar pedido propio si no está sonando -->
                    <button v-if="cancion.mesa_id === mesaId && cancion.estado !== 'reproduciendo'"
                        @click="eliminarPedido(cancion.id)" class="btn-delete-mia" title="Eliminar mi pedido">
                        ✕
                    </button>
                </div>
                <div v-if="cola.length === 0" class="empty-msg">No hay canciones en cola</div>
            </div>
        </section>

        <!-- Historial Personal de esta Mesa -->
        <section class="history-section" v-if="historial.length">
            <h3 class="section-title">Tu Historial</h3>
            <div class="lista-historial">
                <div v-for="h in historial" :key="h.id" class="item-historial" @click="repedirCancion(h)">
                    <img :src="h.miniatura" />
                    <div class="h-info">
                        <p>{{ h.titulo }}</p>
                        <span>Pedir de nuevo ↩️</span>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- Modal / Pantalla de Ingreso de PIN -->
    <div v-else-if="mostarLoginPin" class="error-pantalla">
        <div class="error-card">
            <div class="mesa-badge mb-4">Mesa {{ mesaNombre }}</div>
            <h2 class="text-white">🔐 Código de Acceso</h2>
            <p class="text-slate-400 text-sm mb-6">Ingresa el código de 3 dígitos que aparece en tu mesa.</p>

            <input v-model="pinIngresado" type="tel" maxlength="3" placeholder="000" class="pin-input"
                @keyup.enter="verificarPin" />

            <button @click="verificarPin" class="btn-verificar">Acceder a la Rockola</button>
        </div>
    </div>

    <div v-else class="error-pantalla">
        <div class="error-card">
            <h2>⚠️ Acceso no válido</h2>
            <p>{{ errorSesion }}</p>
            <button @click="reintentar">Intentar de nuevo</button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import type { Cancion, VideoBusqueda, SesionLocal } from '../types/rockola'
import { showNotification } from '@/events/notificationEvents'

const route = useRoute()
const mesaId = route.params.id as string

const query = ref('')
const resultados = ref<VideoBusqueda[]>([])
const esResultadosLocales = ref(false)
const busquedaRealizada = ref(false)
const cola = ref<Cancion[]>([])
const historial = ref<Cancion[]>([])
const cargando = ref(false)
const errorSesion = ref('')
const mesaNombre = ref('')
const mostarLoginPin = ref(false)
const pinIngresado = ref('')

let mesaData: any = null

let realtimeChannel: any = null

const cancionesPropiasActivas = computed(() => {
    return cola.value.filter(c => c.mesa_id === mesaId)
})

const cargarDatos = async () => {
    // 1. Cargar Cola Activa
    const { data: q } = await supabase
        .from('cola_reproduccion')
        .select('*')
        .in('estado', ['pendiente', 'reproduciendo'])
        .order('id', { ascending: true })
    cola.value = q || []

    // 2. Cargar Historial propio (Solo de esta sesión/cliente)
    const storageKey = `sesion_rockola_${mesaId}`
    const local = localStorage.getItem(storageKey)
    if (!local) return
    const sesion: SesionLocal = JSON.parse(local)
    // Convertimos la hora de ingreso a formato ISO para Postgres
    const fechaFiltro = new Date(sesion.horaIngreso).toISOString()

    const { data: h } = await supabase
        .from('cola_reproduccion')
        .select('*')
        .eq('mesa_id', mesaId)
        .in('estado', ['completada', 'saltada']) // Asegura que 'completada' sea igual que en el SQL
        .gt('creado_en', fechaFiltro) // <--- CRITICO: Solo ve sus canciones, no las del cliente anterior
        .order('id', { ascending: false })
        .limit(6)
    historial.value = h || []
}

const inicializarSesion = async () => {
    try {
        const { data: mesa, error } = await supabase.from('mesas').select('*').eq('id', mesaId).single()

        if (error || !mesa) {
            errorSesion.value = 'Mesa no encontrada. Por favor, escanea el QR nuevamente.'
            return
        }

        mesaData = mesa
        mesaNombre.value = mesa.numero_mesa
        const storageKey = `sesion_rockola_${mesaId}`
        const local = localStorage.getItem(storageKey)
        let sesion: SesionLocal | null = local ? JSON.parse(local) : null

        const DOCE_HORAS = 12 * 60 * 60 * 1000
        const ahora = Date.now()

        if (!sesion || (ahora - sesion.horaIngreso > DOCE_HORAS)) {
            // No hay sesión o expiró: Pedir PIN
            mostarLoginPin.value = true
            return
        } else if (sesion.token !== mesa.token_actual) {
            // El token de la mesa cambió (el admin limpió la mesa) y el usuario tiene un token viejo
            errorSesion.value = 'Tu sesión en esta mesa ha terminado. Si sigues en el bar, escanea el QR nuevamente.'
            return
        }

        await cargarDatos()
        escucharCambios()
    } catch (err) {
        errorSesion.value = 'Error de conexión. Intenta escanear de nuevo.'
    }
}

const verificarPin = () => {
    if (pinIngresado.value === mesaData.pin) {
        const storageKey = `sesion_rockola_${mesaId}`
        const sesion: SesionLocal = { mesaId, token: mesaData.token_actual, horaIngreso: Date.now() }
        localStorage.setItem(storageKey, JSON.stringify(sesion))
        mostarLoginPin.value = false
        cargarDatos()
        escucharCambios()
    } else {
        alert('Código PIN incorrecto. Revisa el papelito en tu mesa.')
        pinIngresado.value = ''
    }
}

const escucharCambios = () => {
    realtimeChannel = supabase.channel('mesa-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_reproduccion' }, (payload) => {
            // Si una canción propia cambió de estado a 'completada', refrescamos todo
            cargarDatos()
        }).subscribe()
}

const eliminarPedido = async (id: number) => {
    if (!confirm('¿Deseas cancelar este pedido?')) return
    const { error } = await supabase.from('cola_reproduccion').delete().eq('id', id)
    if (error) alert('No se pudo eliminar el pedido.')
}

const validarYPedir = async (video: VideoBusqueda | Cancion) => {
    const videoId = 'videoId' in video ? video.videoId : video.youtube_video_id

    // 1. Validar límite por mesa
    if (cancionesPropiasActivas.value.length >= 2) {
        alert('Límite excedido: Solo puedes tener 2 canciones activas.')
        return
    }

    // 2. Validar si la canción ya está en la cola activa (Global)
    const yaEstaEnCola = cola.value.some(c => c.youtube_video_id === videoId)
    if (yaEstaEnCola) {
        alert('Esta canción ya está en la cola o sonando. ¡Busca otra!')
        return
    }

    const { error } = await supabase.from('cola_reproduccion').insert([{
        mesa_id: mesaId,
        youtube_video_id: videoId,
        titulo: 'title' in video ? video.title : video.titulo,
        miniatura: 'thumbnail' in video ? video.thumbnail : video.miniatura
    }])

    if (error) {
        console.error(error)
        alert('Error al enviar canción.')
    }
    else {
        resultados.value = []
        query.value = ''
        busquedaRealizada.value = false
        showNotification('¡Canción añadida a la cola!', 'alert-success')
    }
}

const repedirCancion = (cancion: Cancion) => {
    validarYPedir(cancion)
}

const buscarYoutube = async () => {
    if (!query.value.trim() || cancionesPropiasActivas.value.length >= 2) return
    cargando.value = true
    busquedaRealizada.value = true

    try {
        const { data: locales } = await supabase
            .rpc('buscar_canciones_robustas', { term: query.value })

        if (locales && locales.length > 0) {
            const uniqueMap = new Map()
            locales.forEach(l => uniqueMap.set(l.youtube_video_id, l))

            resultados.value = Array.from(uniqueMap.values()).map(l => ({
                videoId: l.youtube_video_id,
                title: l.titulo,
                thumbnail: l.miniatura
            }))
            esResultadosLocales.value = true
        } else {
            // --- MEJORA: Búsqueda automática en YouTube si no hay coincidencias locales ---
            await buscarEnYoutubeAPI()
        }
    } catch (err) {
        console.error('Error en búsqueda local:', err)
    } finally {
        cargando.value = false
    }
}

const buscarEnYoutubeAPI = async () => {
    cargando.value = true
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query.value)}&type=video&key=${apiKey}`

    try {
        const res = await fetch(url)
        const data = await res.json()
        resultados.value = data.items.map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url
        }))
        esResultadosLocales.value = false
    } catch (err) {
        alert('Error al conectar con la API de YouTube.')
    } finally {
        cargando.value = false
    }
}

const reintentar = () => {
    const storageKey = `sesion_rockola_${mesaId}`
    localStorage.removeItem(storageKey)
    window.location.reload()
}

onMounted(async () => {
    await inicializarSesion()
})
onUnmounted(() => { if (realtimeChannel) supabase.removeChannel(realtimeChannel) })
</script>
<style scoped>
.container-client {
    background: #0f172a;
    color: #f8fafc;
    min-height: 100vh;
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', sans-serif;
}

.client-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
}

.mesa-badge {
    background: #10b981;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 10px;
}

.logo-text {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -1px;
}

.logo-text span {
    color: #3b82f6;
}

.search-box {
    display: flex;
    background: #1e293b;
    border-radius: 12px;
    padding: 5px;
    border: 1px solid #334155;
}

.search-box input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 12px 15px;
    color: white;
    outline: none;
}

.search-box button {
    background: #3b82f6;
    border: none;
    color: white;
    width: 45px;
    border-radius: 10px;
    cursor: pointer;
}

.search-section.disabled {
    opacity: 0.5;
}

.btn-youtube-search {
    width: 100%;
    background: #ef4444;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 12px;
    margin-top: 15px;
    font-weight: 800;
    cursor: pointer;
    animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
    0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
}

.limit-msg {
    color: #f59e0b;
    font-size: 12px;
    text-align: center;
    margin-top: 8px;
    font-weight: 600;
}

.card-video {
    display: flex;
    gap: 12px;
    background: #1e293b;
    margin-top: 10px;
    padding: 10px;
    border-radius: 12px;
    cursor: pointer;
}

.no-results-msg {
    text-align: center;
    padding: 15px;
    font-size: 13px;
    color: #94a3b8;
}

.card-video img {
    width: 100px;
    height: 75px;
    object-fit: cover;
    border-radius: 8px;
}

.video-title {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.btn-add {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: bold;
}

.section-title {
    font-size: 16px;
    margin: 30px 0 15px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.item-cancion {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #1e293b;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid transparent;
}

.item-cancion.es-mia {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
}

.item-cancion.playing {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
}

.mini-thumb {
    width: 45px;
    height: 45px;
    border-radius: 6px;
    object-fit: cover;
}

.titulo-c {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.badges {
    display: flex;
    gap: 8px;
    margin-top: 5px;
}

.tag-own {
    background: #3b82f6;
    color: white;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
}

.status-badge {
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    text-transform: uppercase;
}

.btn-delete-mia {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    margin-left: auto;
    transition: all 0.2s;
}

.btn-delete-mia:hover {
    background: #ef4444;
    color: white;
}

.status-badge.reproduciendo {
    background: #10b981;
    color: white;
}

.status-badge.pendiente {
    background: #334155;
    color: #94a3b8;
}

.lista-historial {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.item-historial {
    background: #1e293b;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
}

.item-historial img {
    width: 100%;
    height: 80px;
    object-fit: cover;
    opacity: 0.7;
}

.h-info {
    padding: 8px;
}

.h-info p {
    font-size: 11px;
    margin: 0;
    height: 32px;
    overflow: hidden;
}

.h-info span {
    font-size: 9px;
    color: #3b82f6;
    font-weight: bold;
}

.error-pantalla {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #0a0a0a;
    padding: 20px;
}

.error-card {
    background: #1e293b;
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    color: white;
}

.error-card h2 {
    color: #ef4444;
    margin-bottom: 10px;
}

.error-card button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    margin-top: 20px;
    cursor: pointer;
}

.pin-input {
    background: #0f172a;
    border: 2px solid #334155;
    border-radius: 12px;
    padding: 15px;
    color: white;
    font-size: 32px;
    text-align: center;
    letter-spacing: 10px;
    width: 140px;
    margin-bottom: 20px;
    font-weight: 900;
    outline: none;
}

.pin-input:focus {
    border-color: #3b82f6;
}

.btn-verificar {
    width: 100%;
    background: #3b82f6;
    font-weight: 800;
}
</style>