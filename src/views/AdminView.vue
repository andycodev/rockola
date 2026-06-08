<template>
    <div class="admin-panel">
        <div class="admin-panel h-screen flex flex-col overflow-hidden">
            <!-- Cabecera Fija -->
            <header class="admin-header shrink-0">
                <div class="flex justify-between items-center px-5 py-3 bg-[#111827] border-b border-[#1e293b]">
                    <h1 class="logo-text flex items-center gap-2 text-lg font-black tracking-tight">
                        <Cog6ToothIcon class="w-6 h-6 text-blue-500" />
                        PANEL <span class="text-blue-500">ADMIN</span>
                    </h1>
                    <button class="btn-refresh p-2 rounded-lg bg-[#1e293b] active:scale-95 transition-transform"
                        @click="cargarDatosAdmin" :disabled="cargando">
                        <ArrowPathIcon class="w-5 h-5 text-slate-400" :class="{ 'animate-spin': cargando }" />
                    </button>
                </div>
            </header>

            <!-- Navegación Principal -->
            <nav class="admin-tabs shrink-0 flex bg-[#111827] border-b border-[#1e293b]">
                <button :class="{ active: tabActiva === 'musica' }" @click="tabActiva = 'musica'">
                    <MusicalNoteIcon class="w-5 h-5" />
                    <span>Música</span>
                    <span v-if="colaPendiente.length" class="dot-count">{{ colaPendiente.length }}</span>
                </button>
                <button :class="{ active: tabActiva === 'mesas' }" @click="tabActiva = 'mesas'">
                    <TableCellsIcon class="w-5 h-5" />
                    <span>Mesas</span>
                </button>
            </nav>

            <main class="admin-content flex-1 overflow-y-auto bg-[#0a0f1e] p-4">
                <!-- TAB: GESTIÓN DE MÚSICA -->
                <section v-show="tabActiva === 'musica'" class="animate-in space-y-4">
                    <!-- Monitor en Vivo (Sincronizado) -->
                    <div class="monitor-card bg-black rounded-2xl p-3 border border-[#1e293b]">
                        <div class="monitor-container grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                            <div
                                class="player-wrapper relative aspect-video bg-[#111] rounded-xl overflow-hidden border border-white/5">
                                <div id="admin-player" class="w-full h-full"></div>
                                <div v-if="!cancionSonando"
                                    class="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                                    <TvIcon class="w-8 h-8 text-slate-800 animate-pulse" />
                                </div>
                            </div>
                            <div class="monitor-info flex flex-col justify-center" v-if="cancionSonando">
                                <div class="flex items-center gap-2 mb-2">
                                    <span
                                        class="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">En
                                        Vivo</span>
                                    <span class="text-blue-400 text-xs font-bold flex items-center gap-1">
                                        <TableCellsIcon class="w-3 h-3" /> {{ obtenerNombreMesa(cancionSonando.mesa_id)
                                        }}
                                    </span>
                                </div>
                                <h3 class="text-white font-bold text-sm leading-tight line-clamp-2 mb-3">{{
                                    cancionSonando.titulo }}</h3>
                                <button
                                    class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
                                    @click="saltarTemaActual">
                                    Saltar Tema
                                    <ForwardIcon class="w-4 h-4" />
                                </button>
                            </div>
                            <div v-else class="flex items-center text-slate-500 text-xs italic py-4">
                                Sincronizando con la TV del bar...
                            </div>
                        </div>
                    </div>

                    <!-- Sub-Tabs para Música -->
                    <div
                        class="seccion-listas-pwa bg-[#111827] rounded-2xl border border-[#1e293b] overflow-hidden flex flex-col">
                        <div class="sub-tabs flex p-1 bg-black/40 gap-1 border-b border-[#1e293b]">
                            <button
                                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all"
                                :class="subTabMusica === 'cola' ? 'bg-[#1e293b] text-blue-400 shadow-lg' : 'text-slate-500'"
                                @click="subTabMusica = 'cola'">
                                <ListBulletIcon class="w-4 h-4" /> COLA
                            </button>
                            <button
                                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all"
                                :class="subTabMusica === 'historial' ? 'bg-[#1e293b] text-blue-400 shadow-lg' : 'text-slate-500'"
                                @click="subTabMusica = 'historial'">
                                <ClockIcon class="w-4 h-4" /> HISTORIAL
                            </button>
                        </div>

                        <div class="scroll-container-admin p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <!-- Sub-TAB: COLA -->
                            <div v-if="subTabMusica === 'cola'" class="animate-in">
                                <div v-if="colaPendiente.length === 0"
                                    class="py-10 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">
                                    Cola vacía
                                </div>
                                <div v-for="item in colaPendiente" :key="item.id" class="item-cancion"
                                    :class="item.estado">
                                    <div
                                        class="flex items-center gap-3 p-2 bg-[#0a0f1e] rounded-xl border border-[#1e293b] mb-2 group">
                                        <img :src="item.miniatura" class="w-12 h-12 object-cover rounded-lg shrink-0" />
                                        <div class="flex-1 min-w-0">
                                            <h4 class="text-white text-xs font-bold truncate">{{ item.titulo }}</h4>
                                            <p class="text-[#64748b] text-[10px] font-black uppercase">{{
                                                obtenerNombreMesa(item.mesa_id) }}</p>
                                        </div>
                                        <button class="p-2 text-slate-500 hover:text-red-500 transition-colors"
                                            @click="quitarCancion(item.id)">
                                            <XMarkIcon class="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Sub-TAB: HISTORIAL -->
                            <div v-if="subTabMusica === 'historial'" class="animate-in">
                                <div v-for="item in historialAdmin" :key="item.id"
                                    class="flex items-center gap-3 p-2 opacity-60 mb-2">
                                    <img :src="item.miniatura"
                                        class="w-10 h-10 object-cover rounded-lg grayscale shrink-0" />
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-slate-400 text-xs truncate">{{ item.titulo }}</h4>
                                        <p class="text-slate-600 text-[9px] uppercase">{{
                                            obtenerNombreMesa(item.mesa_id) }}</p>
                                    </div>
                                    <span
                                        class="text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-700 text-slate-500 uppercase">
                                        {{ item.estado === 'completada' ? 'OK' : 'SALT' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- TAB: ESTRUCTURA DE MESAS -->
                <section v-show="tabActiva === 'mesas'" class="animate-in space-y-6">
                    <div class="seccion-mesas">
                        <h2
                            class="section-title flex items-center gap-2 mb-4 text-xs font-black text-slate-500 tracking-widest uppercase">
                            <PlusIcon class="w-4 h-4" /> Agregar Nueva Mesa
                        </h2>
                        <div class="crear-mesa-box flex gap-2">
                            <input v-model="nuevaMesaNombre"
                                class="flex-1 bg-[#111827] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Ej: Mesa 05" @keyup.enter="crearMesa" />
                            <button class="bg-blue-600 text-white px-5 rounded-xl active:scale-95 transition-transform"
                                @click="crearMesa" :disabled="!nuevaMesaNombre.trim()">
                                <PlusIcon class="w-6 h-6 stroke-[3]" />
                            </button>
                        </div>

                        <div class="mesas-grid grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div v-for="mesa in mesas" :key="mesa.id"
                                class="card-mesa bg-[#111827] border border-[#1e293b] p-3 rounded-2xl flex flex-col items-center">
                                <div class="w-full flex justify-between items-start mb-2">
                                    <h3 class="text-blue-500 font-black text-sm uppercase italic">{{ mesa.numero_mesa }}
                                    </h3>
                                    <div class="flex gap-1">
                                        <button class="p-1 text-slate-600 hover:text-blue-400"
                                            @click="regenerarPin(mesa)" title="Regenerar PIN">
                                            <ArrowPathIcon class="w-4 h-4" />
                                        </button>
                                        <button class="p-1 text-slate-600 hover:text-blue-400"
                                            @click="descargarQR(mesa)" title="Descargar imagen QR">
                                            <ArrowDownTrayIcon class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div :id="'qr-container-' + mesa.id"
                                    class="qr-container bg-white p-2 rounded-xl mb-3 shadow-xl">
                                    <qrcode-vue :value="obtenerUrlQR(mesa.id)" :size="90" level="H"
                                        background="#ffffff" />
                                </div>

                                <!-- Link de la mesa copiable -->
                                <div class="w-full mb-3 px-1">
                                    <p class="text-[9px] text-slate-500 uppercase font-black mb-1 text-left">Link:</p>
                                    <div class="relative group">
                                        <input readonly :value="obtenerUrlQR(mesa.id)"
                                            @click="($event.target as HTMLInputElement).select()"
                                            class="w-full bg-black/30 border border-white/5 rounded-lg pl-2 pr-8 py-1.5 text-[9px] text-blue-400 outline-none cursor-pointer truncate" />
                                        <button @click="copiarAlPortapapeles(obtenerUrlQR(mesa.id), '¡Link copiado!')"
                                            class="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors">
                                            <DocumentDuplicateIcon class="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div
                                    class="w-full bg-black/40 rounded-lg py-1.5 px-3 flex justify-between items-center mb-3">
                                    <LockClosedIcon class="w-3 h-3 text-slate-500" />
                                    <div class="flex items-center gap-2">
                                        <input readonly :value="mesa.pin"
                                            @click="($event.target as HTMLInputElement).select()"
                                            class="bg-transparent border-none p-0 text-xs font-mono font-bold text-white tracking-widest w-12 text-right outline-none cursor-pointer" />
                                        <button @click="copiarAlPortapapeles(mesa.pin, '¡PIN copiado!')"
                                            class="text-slate-500 hover:text-white transition-colors">
                                            <DocumentDuplicateIcon class="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-colors"
                                    @click="limpiarMesa(mesa)">
                                    Reiniciar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { supabase } from '../lib/supabaseClient'
import QrcodeVue from 'qrcode.vue'
import type { Mesa, Cancion } from '../types/rockola'
import { showNotification } from '@/events/notificationEvents'
import {
    Cog6ToothIcon,
    ArrowPathIcon,
    MusicalNoteIcon,
    TableCellsIcon,
    TvIcon,
    ForwardIcon,
    XMarkIcon,
    PlusIcon,
    LockClosedIcon,
    ListBulletIcon,
    ClockIcon,
    DocumentDuplicateIcon,
    ArrowDownTrayIcon
} from '@heroicons/vue/24/solid'

const mesas = ref<Mesa[]>([])
const canciones = ref<Cancion[]>([])
const historialAdmin = ref<Cancion[]>([])
const nuevaMesaNombre = ref('')
const tabActiva = ref<'musica' | 'mesas'>('musica')
const subTabMusica = ref<'cola' | 'historial'>('cola')
const cargando = ref(false)
const player = ref<any>(null)

const cancionSonando = computed(() => {
    return canciones.value.find(c => c.estado === 'reproduciendo')
})

const colaPendiente = computed(() => {
    return canciones.value.filter(c => c.estado === 'pendiente')
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

const copiarAlPortapapeles = async (texto: string, mensaje: string) => {
    try {
        await navigator.clipboard.writeText(texto)
        showNotification(mensaje, 'alert-success')
    } catch (err) {
        showNotification('No se pudo copiar el texto', 'alert-error')
    }
}

const descargarQR = (mesa: Mesa) => {
    const container = document.getElementById(`qr-container-${mesa.id}`)
    const canvas = container?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `QR_${mesa.numero_mesa.replace(/\s+/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showNotification('QR descargado', 'alert-success')
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

const quitarCancion = async (id: number) => {
    if (!confirm('¿Quitar canción de la cola?')) return
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
.sticky-top {
    position: sticky;
    top: 0;
    z-index: 50;
}

.sticky-tabs {
    position: sticky;
    top: 56px;
    /* Altura aproximada del header */
    z-index: 45;
}

.admin-panel {
    background: #0a0f1e;
    color: #f8fafc;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
}

.admin-content {
    flex: 1;
    padding: 15px;
    padding-bottom: 80px;
    /* Espacio para no chocar con controles de mobile */
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

.scroll-container-admin {
    flex: 1;
    max-height: calc(100vh - 400px);
    overflow-y: auto;
    padding-bottom: 20px;
}

.scroll-styled::-webkit-scrollbar {
    width: 4px;
}

.scroll-styled::-webkit-scrollbar-track {
    background: transparent;
}

.scroll-styled::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 10px;
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