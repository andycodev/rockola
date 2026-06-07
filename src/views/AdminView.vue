<template>
    <div class="admin-panel dark-theme">
        <header class="admin-header">
            <h1>⚙️ PANEL DE <span>CONTROL</span></h1>
            <button class="btn-refresh" @click="cargarDatosAdmin">Refrescar 🔄</button>
        </header>

        <div class="grid-layout">
            <div class="seccion">
                <h2>Estructura de Mesas</h2>
                <div class="crear-mesa-box">
                    <input v-model="nuevaMesaNombre" placeholder="Ej: Mesa 05" @keyup.enter="crearMesa" />
                    <button @click="crearMesa" :disabled="!nuevaMesaNombre.trim()">Agregar Mesa +</button>
                </div>

                <div class="mesas-list">
                    <div v-for="mesa in mesas" :key="mesa.id" class="card-mesa">
                        <h3>{{ mesa.numero_mesa }}</h3>
                        <div class="qr-container">
                            <qrcode-vue :value="obtenerUrlQR(mesa.id)" :size="100" level="H" background="#ffffff" />
                        </div>
                        <p class="url-text">{{ obtenerUrlQR(mesa.id) }}</p>
                        <button class="btn-clear" @click="limpiarMesa(mesa)">Limpiar Mesa</button>
                    </div>
                </div>
            </div>

            <div class="seccion">
                <h2>Cola Activa</h2>
                <div v-if="canciones.length === 0" class="empty-msg">Cola vacía.</div>
                <div v-for="item in canciones" :key="item.id" class="item-cancion" :class="item.estado">
                    <img :src="item.miniatura" />
                    <div class="detalles">
                        <h4>{{ item.titulo }}</h4>
                        <p class="meta">
                            <span :class="['badge-status', item.estado]">{{ item.estado === 'reproduciendo' ? 'SONANDO'
                                : 'EN COLA' }}</span>
                            Mesa: <strong>{{ obtenerNombreMesa(item.mesa_id) }}</strong>
                        </p>
                    </div>
                    <button v-if="item.estado === 'reproduciendo'" class="btn-skip" @click="saltarCancion(item)">Saltar
                        ⏭️</button>
                    <button v-else class="btn-delete" @click="saltarCancion(item)">Quitar ❌</button>
                </div>

                <h2 class="mt-8">Historial Reciente</h2>
                <div v-for="item in historialAdmin" :key="item.id" class="item-cancion historial">
                    <img :src="item.miniatura" class="grayscale" />
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
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import QrcodeVue from 'qrcode.vue'
import type { Mesa, Cancion } from '../types/rockola'
import { onUnmounted } from 'vue'

const mesas = ref<Mesa[]>([])
const canciones = ref<Cancion[]>([])
const historialAdmin = ref<Cancion[]>([])
const nuevaMesaNombre = ref('')

const cargarDatosAdmin = async () => {
    const { data: m } = await supabase.from('mesas').select('*').order('numero_mesa', { ascending: true })
    console.log("Mesas cargadas:", m)
    mesas.value = m || []

    const { data: c } = await supabase
        .from('cola_reproduccion')
        .select('*')
        .in('estado', ['pendiente', 'reproduciendo'])
        .order('id', { ascending: true })
    canciones.value = c || []

    const { data: h } = await supabase
        .from('cola_reproduccion')
        .select('*')
        .in('estado', ['completada', 'saltada'])
        .order('id', { descending: true })
        .limit(5)
    historialAdmin.value = h || []
}

// Crear una nueva mesa en el sistema
const crearMesa = async () => {
    if (!nuevaMesaNombre.value.trim()) return
    const { error } = await supabase.from('mesas').insert([{ numero_mesa: nuevaMesaNombre.value }])
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

// Opción 3: Limpiar mesa y cambiar el token remoto para desvincular intrusos
const limpiarMesa = async (mesa: Mesa) => {
    if (!confirm(`¿Vaciar la ${mesa.numero_mesa}? Se invalidarán los accesos anteriores.`)) return

    const nuevoToken = crypto.randomUUID()

    // 1. Invalidar token
    await supabase.from('mesas').update({ token_actual: nuevoToken }).eq('id', mesa.id)
    // 2. Cancelar canciones que dejaron pendientes
    await supabase.from('cola_reproduccion').update({ estado: 'saltada' }).eq('mesa_id', mesa.id).eq('estado', 'pendiente')

    alert('Mesa desvinculada correctamente.')
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
    padding: 30px;
    font-family: sans-serif;
    background: #f3f4f6;
    min-height: 100vh;
}

.grid-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 20px;
}

.seccion {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.crear-mesa-box {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.crear-mesa-box input {
    flex: 1;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.crear-mesa-box button {
    background: #10b981;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
}

.mesas-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.card-mesa {
    border: 1px solid #e5e7eb;
    padding: 15px;
    border-radius: 6px;
    text-align: center;
    background: #fafafa;
}

.url-text {
    font-size: 10px;
    color: #6b7280;
    word-break: break-all;
    margin: 8px 0;
}

.btn-clear {
    background: #ef4444;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    font-size: 12px;
}

.item-cancion {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px;
    border-bottom: 1px solid #f3f4f6;
}

.item-cancion img {
    width: 60px;
    height: 45px;
    object-fit: cover;
    border-radius: 4px;
}

.detalles {
    flex: 1;
}

.detalles h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
}

.detalles p {
    margin: 0;
    font-size: 12px;
}

.btn-skip {
    background: #f59e0b;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
}

.btn-delete {
    background: #6b7280;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
}
</style>