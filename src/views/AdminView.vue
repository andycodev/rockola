<template>
    <div class="admin-panel">
        <header class="admin-header">
            <h1 class="logo-text">⚙️ PANEL DE <span>CONTROL</span></h1>
            <button class="btn-refresh" @click="cargarDatosAdmin">Refrescar 🔄</button>
        </header>

        <div class="grid-layout">
            <div class="seccion">
                <h2 class="section-title">Estructura de Mesas</h2>
                <div class="crear-mesa-box">
                    <input v-model="nuevaMesaNombre" placeholder="Nombre de mesa (Ej: Mesa 05)"
                        @keyup.enter="crearMesa" />
                    <button @click="crearMesa" :disabled="!nuevaMesaNombre.trim()">Agregar Mesa +</button>
                </div>

                <div class="mesas-list">
                    <div v-for="mesa in mesas" :key="mesa.id" class="card-mesa">
                        <div class="flex justify-between items-start mb-3">
                            <h3 class="text-orange-500 font-black">{{ mesa.numero_mesa }}</h3>
                            <div class="flex flex-col items-end gap-1">
                                <span
                                    class="pin-masked bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-mono cursor-pointer"
                                    title="Mantén presionado o hover para ver">PIN: <span class="pin-value">{{ mesa.pin
                                        }}</span></span>
                                <button @click="regenerarPin(mesa)"
                                    class="text-[9px] text-blue-400 hover:text-blue-300 underline font-bold uppercase tracking-tighter">Nuevo
                                    PIN</button>
                            </div>
                        </div>
                        <div class="qr-container">
                            <qrcode-vue :value="obtenerUrlQR(mesa.id)" :size="100" level="H" background="#ffffff" />
                        </div>
                        <p class="url-text">{{ obtenerUrlQR(mesa.id) }}</p>
                        <button class="btn-clear" @click="limpiarMesa(mesa)">Limpiar / Nueva Sesión</button>
                    </div>
                </div>
            </div>

            <div class="seccion">
                <h2 class="section-title">Cola de Reproducción Activa</h2>
                <div v-if="canciones.length === 0" class="empty-msg">No hay canciones en espera.</div>
                <div v-for="item in canciones" :key="item.id" class="item-cancion" :class="item.estado">
                    <img :src="item.miniatura" />
                    <div class="detalles">
                        <h4>{{ item.titulo }}</h4>
                        <p class="meta">
                            <span :class="['badge-status', item.estado]">
                                {{ item.estado === 'reproduciendo' ? 'SONANDO' : 'EN COLA' }}
                            </span>
                            Mesa: <strong>{{ obtenerNombreMesa(item.mesa_id) }}</strong>
                        </p>
                    </div>
                    <button v-if="item.estado === 'reproduciendo'" class="btn-skip" @click="saltarCancion(item)">Saltar
                        ⏭️</button>
                    <button v-else class="btn-delete" @click="saltarCancion(item)">Quitar ❌</button>
                </div>

                <h2 class="section-title mt-8">Historial Reciente</h2>
                <div v-for="item in historialAdmin" :key="item.id" class="item-cancion historial">
                    <img :src="item.miniatura" class="grayscale opacity-50" />
                    <div class="detalles">
                        <h4 class="text-slate-400">{{ item.titulo }}</h4>
                        <p class="meta">
                            <span class="badge-status completada">{{ item.estado.toUpperCase() }}</span>
                            Mesa: {{ obtenerNombreMesa(item.mesa_id) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import QrcodeVue from 'qrcode.vue'
import type { Mesa, Cancion } from '../types/rockola'

const mesas = ref<Mesa[]>([])
const canciones = ref<Cancion[]>([])
const historialAdmin = ref<Cancion[]>([])
const nuevaMesaNombre = ref('')

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

// Generar un nuevo PIN sin limpiar la mesa ni cancelar pedidos
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

const saltarCancion = async (cancion: Cancion) => {
    await supabase.from('cola_reproduccion').update({ estado: 'saltada' }).eq('id', cancion.id)
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
    background: #0f172a;
    color: #f8fafc;
    min-height: 100vh;
    padding: 20px;
    font-family: 'Inter', sans-serif;
}

.admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 20px;
    margin-bottom: 30px;
}

.logo-text {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -1px;
}

.logo-text span {
    color: #3b82f6;
}

.btn-refresh {
    background: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
    padding: 8px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
}

.grid-layout {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 30px;
}

.seccion {
    background: #1e293b;
    padding: 25px;
    border-radius: 20px;
    border: 1px solid #334155;
}

.section-title {
    font-size: 18px;
    margin-bottom: 20px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.mt-8 {
    margin-top: 40px;
}

.crear-mesa-box {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
}

.crear-mesa-box input {
    flex: 1;
    background: #0f172a;
    border: 1px solid #334155;
    padding: 12px 15px;
    color: white;
    border-radius: 12px;
    outline: none;
}

.crear-mesa-box button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0 20px;
    border-radius: 12px;
    font-weight: 700;
}

.mesas-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 15px;
}

.card-mesa {
    background: #0f172a;
    border: 1px solid #334155;
    padding: 15px;
    border-radius: 15px;
    text-align: center;
}

.qr-container {
    background: white;
    padding: 10px;
    border-radius: 10px;
    display: inline-block;
    margin: 10px 0;
}

.url-text {
    font-size: 9px;
    color: #475569;
    word-break: break-all;
}

.btn-clear {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 8px;
    border-radius: 10px;
    font-size: 11px;
    width: 100%;
    margin-top: 10px;
    font-weight: 700;
}

.item-cancion {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px;
    background: #0f172a;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid #334155;
}

.item-cancion img {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    object-fit: cover;
}

.detalles {
    flex: 1;
}

.detalles h4 {
    font-size: 13px;
    margin: 0 0 5px 0;
    font-weight: 600;
}

.meta {
    font-size: 11px;
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

.btn-skip {
    background: #f59e0b;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 11px;
}

.btn-delete {
    background: #334155;
    color: #94a3b8;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 11px;
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

.pin-value {
    filter: blur(4px);
    transition: filter 0.2s ease;
    user-select: none;
    display: inline-block;
    margin-left: 2px;
}

.pin-masked:hover .pin-value,
.pin-masked:active .pin-value {
    filter: blur(0);
}
</style>