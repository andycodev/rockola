<template>
    <div
        class="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-orange-500 selection:text-white">

        <!-- Cabecera Fija (Header + Tabs) -->
        <div class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
            v-click-outside="() => activeMenuId = null">
            <header class="px-4 py-3 max-w-md mx-auto">
                <div class="max-w-md mx-auto">
                    <h1 class="text-xl font-black tracking-tight text-slate-900 uppercase text-center">
                        Control de <span class="text-orange-600">pasajeros</span>
                    </h1>
                    <p class="text-sm text-slate-500 text-center font-bold mt-1 leading-tight px-4">
                        Registro de personas en respaldo al Dr. Roldán Díaz.
                    </p>

                    <!-- Resumen Total General -->
                    <div class="flex flex-col items-center mt-4 gap-4">
                        <div
                            class="flex items-center bg-slate-900 text-white rounded-[2rem] p-1.5 pr-8 shadow-2xl shadow-slate-300 border border-white/10 ring-4 ring-slate-50 transition-transform active:scale-95">
                            <div
                                class="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center shadow-lg">
                                <UserGroupIcon class="w-6 h-6 text-white" />
                            </div>
                            <div class="ml-4 flex flex-col items-start leading-none">
                                <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Total
                                    Pasajeros</span>
                                <div class="flex items-baseline gap-1">
                                    <span class="text-2xl font-black text-orange-500 tracking-tighter">{{
                                        pasajeros.length }}</span>
                                    <span
                                        class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Registrados</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-center gap-3">
                            <div
                                class="flex items-center bg-orange-600 text-white pl-2.5 pr-1 py-1 rounded-full shadow-lg shadow-orange-200">
                                <TruckIcon class="w-3.5 h-3.5 mr-1.5 opacity-80" />
                                <span class="text-[10px] font-black uppercase tracking-widest mr-2">Bus 1</span>
                                <div
                                    class="bg-white text-orange-600 h-6 min-w-[24px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-black">
                                    {{ pasajerosBus1.length }}
                                </div>
                            </div>
                            <div
                                class="flex items-center bg-amber-500 text-white pl-2.5 pr-1 py-1 rounded-full shadow-lg shadow-amber-200">
                                <TruckIcon class="w-3.5 h-3.5 mr-1.5 opacity-80" />
                                <span class="text-[10px] font-black uppercase tracking-widest mr-2">Bus 2</span>
                                <div
                                    class="bg-white text-amber-500 h-6 min-w-[24px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-black">
                                    {{ pasajerosBus2.length }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Resumen de Asistencia (Solo en Listas) -->
            <div v-if="tabActiva !== 'registro'" class="px-4 pb-2 max-w-md mx-auto">
                <div class="bg-slate-900 rounded-2xl p-3 text-white flex items-center justify-between shadow-lg">
                    <div class="flex gap-4">
                        <div class="text-center">
                            <p class="text-[10px] uppercase font-black text-slate-400">Subieron</p>
                            <p class="text-lg font-black text-green-400 leading-none">{{ statsAsistencia.asistieron }}
                            </p>
                        </div>
                        <div class="text-center border-l border-slate-700 pl-4">
                            <p class="text-[10px] uppercase font-black text-slate-400">Faltan</p>
                            <p class="text-lg font-black text-orange-400 leading-none">{{ statsAsistencia.faltan }}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button @click="compartirWhatsApp(false)"
                            class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors active:scale-95">
                            <ShareIcon class="w-4 h-4 text-blue-400" />
                            <span
                                class="text-[10px] font-black uppercase tracking-tight text-slate-300">Compartir</span>
                        </button>
                        <button @click="confirmarReinicioGeneral"
                            class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors active:scale-95">
                            <ArrowPathIcon class="w-4 h-4 text-orange-500" />
                            <span class="text-[10px] font-black uppercase tracking-tight text-slate-300">Reiniciar
                                Todo</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- NAVEGACIÓN POR TABS -->
            <div class="px-4 pb-3 max-w-md mx-auto">
                <nav class="flex p-1 bg-slate-200/50 rounded-2xl border border-white/50 shadow-inner">
                    <button @click="tabActiva = 'registro'"
                        :class="tabActiva === 'registro' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500'"
                        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm">
                        <UserPlusIcon class="w-4 h-4" /> Registro
                    </button>
                    <button @click="tabActiva = 'bus1'"
                        :class="tabActiva === 'bus1' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500'"
                        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm">
                        <TruckIcon class="w-4 h-4" /> Bus 1
                    </button>
                    <button @click="tabActiva = 'bus2'"
                        :class="tabActiva === 'bus2' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-500'"
                        class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm">
                        <TruckIcon class="w-4 h-4" /> Bus 2
                    </button>
                </nav>
            </div>

            <!-- Buscador Fijo (Solo en Listas) -->
            <div v-if="tabActiva !== 'registro'" class="px-4 pb-3 max-w-md mx-auto animate-in fade-in duration-300">
                <div class="relative group">
                    <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input v-model="filtroNombre" type="text" :placeholder="'Buscar en Bus ' + tabActiva.at(-1)"
                        class="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-slate-100 outline-none font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20" />
                </div>
            </div>
        </div>

        <main class="mx-auto max-w-md p-4 pb-24">

            <!-- CONTENIDO DINÁMICO CON TRANSICIONES -->
            <Transition name="fade" mode="out-in">
                <!-- VISTA: REGISTRO -->
                <section v-if="tabActiva === 'registro'" key="registro" class="space-y-4">
                    <div class="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div class="mb-6 flex items-center gap-3">
                            <div :class="editandoPasajeroId ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-600'"
                                class="p-3 rounded-2xl">
                                <UserPlusIcon v-if="!editandoPasajeroId" class="w-6 h-6" />
                                <PencilSquareIcon v-else class="w-6 h-6" />
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-slate-900 leading-none">
                                    {{ editandoPasajeroId ? 'Editar Pasajero' : 'Nuevo Registro' }}
                                </h2>
                                <p class="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-tighter">Ingrese
                                    datos del pasajero</p>
                            </div>
                        </div>

                        <form @submit.prevent="guardarPasajero" class="space-y-5">
                            <div class="space-y-1.5">
                                <label class="text-xs font-black uppercase text-slate-400 ml-1">Nombre
                                    Completo</label>
                                <input v-model="formulario.nombre" @input="validarNombre" type="text" required
                                    placeholder="Ej. JUAN PEREZ"
                                    class="w-full rounded-2xl border-slate-200 bg-slate-50 px-5 py-4 text-base font-bold outline-none transition focus:ring-4 focus:ring-orange-500/10 focus:bg-white uppercase" />
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1.5">
                                    <label class="text-xs font-black uppercase text-slate-400 ml-1">Teléfono</label>
                                    <input v-model="formulario.telefono" @input="validarTelefono" type="tel"
                                        inputmode="numeric" placeholder="Ej. 987654321"
                                        class="w-full rounded-2xl border-slate-200 bg-slate-50 px-5 py-4 text-base font-bold outline-none transition focus:bg-white" />
                                </div>
                                <div class="space-y-1.5">
                                    <label
                                        class="text-xs font-black uppercase text-slate-400 ml-1 text-center block">Unidad</label>
                                    <div class="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl h-[60px]">
                                        <button type="button" @click="formulario.bus_asignado = 1"
                                            :class="formulario.bus_asignado === 1 ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'"
                                            class="rounded-xl text-sm font-black transition-all">Bus 1</button>
                                        <button type="button" @click="formulario.bus_asignado = 2"
                                            :class="formulario.bus_asignado === 2 ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'"
                                            class="rounded-xl text-sm font-black transition-all">Bus 2</button>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                <div class="flex justify-between items-center ml-1">
                                    <label class="text-xs font-black uppercase text-slate-400">Nota opcional</label>
                                    <span class="text-xs font-bold"
                                        :class="(formulario.nota || '').length >= 150 ? 'text-red-500' : 'text-slate-400'">
                                        {{ (formulario.nota || '').length }}/150
                                    </span>
                                </div>
                                <textarea v-model="formulario.nota" rows="3" maxlength="150"
                                    placeholder="Ejemplo: Subirá en el camino."
                                    class="w-full rounded-2xl border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium outline-none transition focus:bg-white resize-none"></textarea>
                            </div>

                            <div class="flex flex-col gap-3 pt-4">
                                <button type="submit" :disabled="guardando || !formulario.nombre.trim()"
                                    :class="editandoPasajeroId ? 'bg-amber-500 shadow-amber-200' : 'bg-orange-600 shadow-orange-200'"
                                    class="w-full rounded-2xl py-5 font-black text-lg text-white shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wide">
                                    <component
                                        :is="guardando ? 'span' : (editandoPasajeroId ? CheckCircleIcon : UserPlusIcon)"
                                        class="w-6 h-6" />
                                    {{ guardando ? 'Guardando...' : (editandoPasajeroId ? 'ACTUALIZAR DATOS' :
                                        'REGISTRAR AHORA') }}
                                </button>
                                <button v-if="editandoPasajeroId" type="button" @click="cancelarEdicion"
                                    class="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600">
                                    Cancelar Edición
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Banner de Instalación PWA (Movido debajo del card de registro) -->
                    <div v-if="showInstallPrompt" class="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div
                            class="bg-slate-900 text-white rounded-3xl p-4 shadow-xl border border-white/10 flex items-center gap-4">
                            <div
                                class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                                <ArrowDownTrayIcon class="w-6 h-6 text-white" />
                            </div>
                            <div class="flex-1">
                                <h4 class="text-xs font-black uppercase tracking-widest text-orange-500 mb-0.5">App
                                    disponible</h4>
                                <p class="text-[11px] font-bold text-slate-300 leading-tight">
                                    ¡Instala para un acceso más rápido y sin distracciones!
                                </p>
                            </div>
                            <div class="flex flex-col gap-1">
                                <button @click="installPWA"
                                    class="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95">
                                    Instalar
                                </button>
                                <button @click="showInstallPrompt = false"
                                    class="text-slate-500 hover:text-white px-4 py-1 text-[9px] font-bold uppercase tracking-tighter">
                                    Ocultar
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- VISTA: LISTADOS (BUS 1 O BUS 2) -->
                <section v-else key="listas" class="space-y-4">
                    <!-- Lista Estilo Card -->
                    <div class="space-y-3 px-1">
                        <TransitionGroup name="list">
                            <div v-for="(p, index) in pasajerosFiltrados" :key="p.id"
                                :class="p.asistio ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'"
                                class="p-3 rounded-2xl shadow-sm border flex items-center gap-3 transition-all duration-300">

                                <!-- Botón de Asistencia Rápida -->
                                <button @click="toggleAsistencia(p)"
                                    :class="p.asistio ? 'bg-green-600 text-white shadow-green-200 shadow-lg' : 'bg-slate-100 text-slate-400'"
                                    class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 font-black">
                                    <CheckIcon v-if="p.asistio" class="w-6 h-6 stroke-[3]" />
                                    <span v-else class="text-xs">{{ index + 1 }}</span>
                                </button>

                                <div class="flex-1 min-w-0">
                                    <h4 :class="p.asistio ? 'text-green-900' : 'text-slate-800'"
                                        class="font-extrabold text-sm leading-tight break-words tracking-tight uppercase">
                                        {{ p.nombre_completo }}
                                    </h4>
                                    <p v-if="p.telefono"
                                        class="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                                        <PhoneIcon class="w-3.5 h-3.5" /> {{ p.telefono }}
                                    </p>
                                </div>

                                <!-- Menú de Opciones (Solo los 3 puntos) -->
                                <div class="relative">
                                    <button @click.stop="activeMenuId = activeMenuId === p.id ? null : p.id"
                                        class="p-2 text-slate-400 hover:text-slate-600 active:bg-slate-100 rounded-lg transition-colors">
                                        <EllipsisVerticalIcon class="w-6 h-6" />
                                    </button>

                                    <!-- Dropdown Menu -->
                                    <div v-if="activeMenuId === p.id" :class="[
                                        'absolute right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-200',
                                        index >= pasajerosFiltrados.length - 2 && pasajerosFiltrados.length > 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                                    ]">
                                        <button @click="toggleAsistencia(p); activeMenuId = null"
                                            class="w-full px-4 py-3 text-left text-xs font-bold flex items-center gap-3 hover:bg-slate-50">
                                            <CheckCircleIcon :class="p.asistio ? 'text-orange-500' : 'text-green-500'"
                                                class="w-5 h-5" />
                                            {{ p.asistio ? 'Anular Asistencia' : 'Subió al Bus' }}
                                        </button>
                                        <button v-if="p.telefono" @click="pasajeroALlamar = p; activeMenuId = null"
                                            class="w-full px-4 py-3 text-left text-xs font-bold flex items-center gap-3 hover:bg-slate-50 text-slate-700">
                                            <PhoneIcon class="text-green-500 w-5 h-5" /> Llamar
                                        </button>
                                        <button v-if="p.nota" @click="notaEnModal = p; activeMenuId = null"
                                            class="w-full px-4 py-3 text-left text-xs font-bold flex items-center gap-3 hover:bg-slate-50 text-slate-700">
                                            <DocumentTextIcon class="text-blue-500 w-5 h-5" /> Ver Nota
                                        </button>
                                        <button @click="editarPasajero(p); activeMenuId = null"
                                            class="w-full px-4 py-3 text-left text-xs font-bold flex items-center gap-3 hover:bg-slate-50 text-orange-600">
                                            <PencilSquareIcon class="w-5 h-5" /> Editar Datos
                                        </button>
                                        <div class="border-t border-slate-100 my-1"></div>
                                        <button @click="eliminarPasajero(p); activeMenuId = null"
                                            class="w-full px-4 py-3 text-left text-xs font-bold flex items-center gap-3 hover:bg-slate-50 text-red-500">
                                            <TrashIcon class="w-5 h-5" /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </TransitionGroup>

                        <div v-if="pasajerosFiltrados.length === 0" class="py-20 text-center">
                            <UserGroupIcon class="w-12 h-12 text-slate-200 mx-auto mb-2" />
                            <p class="text-slate-400 font-bold text-xs uppercase tracking-widest">No hay pasajeros</p>
                        </div>
                    </div>
                </section>
            </Transition>
        </main>

        <!-- Componente de Notificación Global -->
        <Notification :message="notificationState.message" :type="notificationState.type" :show="notificationState.show"
            @close="hideNotification" />

        <!-- Modal para Ver Nota -->
        <Transition name="fade">
            <div v-if="notaEnModal"
                class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                @click.self="notaEnModal = null">
                <div
                    class="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                    <div
                        class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DocumentTextIcon class="w-8 h-8" />
                    </div>
                    <h3 class="font-black text-slate-900 uppercase text-xs tracking-widest mb-1 opacity-50">Nota del
                        Pasajero</h3>
                    <p class="text-base font-bold text-slate-800 mb-4 uppercase leading-tight">
                        {{ notaEnModal.nombre_completo }}
                    </p>
                    <div
                        class="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-base leading-relaxed italic whitespace-pre-wrap text-left">
                        "{{ notaEnModal.nota }}"
                    </div>
                    <button @click="notaEnModal = null"
                        class="w-full mt-6 bg-slate-900 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-xs uppercase tracking-widest">
                        Cerrar
                    </button>
                </div>
            </div>
        </Transition>

        <!-- Modal Confirmación de Llamada -->
        <Transition name="fade">
            <div v-if="pasajeroALlamar"
                class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                @click.self="pasajeroALlamar = null">
                <div
                    class="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                    <div
                        class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PhoneIcon class="w-8 h-8" />
                    </div>
                    <h3 class="font-black text-slate-900 uppercase text-sm tracking-widest mb-2">Confirmar Llamada</h3>
                    <p class="text-slate-500 text-xs mb-6">
                        ¿Deseas llamar a <span class="font-bold text-slate-800">{{ pasajeroALlamar.nombre_completo
                        }}</span>?
                        <br>
                        <span class="text-[14px] font-black text-green-600 block mt-2">{{ pasajeroALlamar.telefono
                        }}</span>
                    </p>
                    <div class="flex gap-3">
                        <button @click="pasajeroALlamar = null"
                            class="flex-1 bg-slate-100 text-slate-500 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-xs uppercase tracking-widest">
                            Cancelar
                        </button>
                        <a :href="'tel:' + pasajeroALlamar.telefono" @click="pasajeroALlamar = null"
                            class="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                            Llamar
                        </a>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Modal Confirmación de Eliminación -->
        <Transition name="fade">
            <div v-if="pasajeroAEliminar"
                class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                @click.self="pasajeroAEliminar = null">
                <div
                    class="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                    <div
                        class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrashIcon class="w-8 h-8" />
                    </div>
                    <h3 class="font-black text-slate-900 uppercase text-sm tracking-widest mb-2">Eliminar Registro</h3>
                    <p class="text-slate-500 text-xs mb-6 px-2">
                        ¿Estás seguro de eliminar a <span class="font-bold text-slate-800">{{
                            pasajeroAEliminar.nombre_completo }}</span>?
                        Esta acción no se puede deshacer.
                    </p>
                    <div class="flex gap-3">
                        <button @click="pasajeroAEliminar = null"
                            class="flex-1 bg-slate-100 text-slate-500 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-xs uppercase tracking-widest">
                            Volver
                        </button>
                        <button @click="confirmarEliminacionDefinitiva"
                            class="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-xs uppercase tracking-widest">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Modal Confirmación Reinicio General -->
        <Transition name="fade">
            <div v-if="mostrarModalReinicio"
                class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                @click.self="mostrarModalReinicio = false">
                <div
                    class="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                    <div
                        class="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowPathIcon class="w-8 h-8" />
                    </div>
                    <h3 class="font-black text-slate-900 uppercase text-sm tracking-widest mb-2">Reiniciar Lista</h3>
                    <p class="text-slate-500 text-xs mb-6 px-2">
                        Esto marcará a TODOS los pasajeros como <span
                            class="font-bold text-slate-800 underline uppercase">pendientes</span>. Ideal para iniciar
                        el viaje de vuelta.
                    </p>
                    <div class="flex gap-3">
                        <button @click="mostrarModalReinicio = false"
                            class="flex-1 bg-slate-100 text-slate-500 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest">
                            Cancelar
                        </button>
                        <button @click="ejecutarReinicioGeneral"
                            class="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest active:scale-95">
                            Reiniciar
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { createClient } from '@supabase/supabase-js'
// Importar iconos de Heroicons
import {
    CheckCircleIcon,
    UserPlusIcon,
    TruckIcon,
    PencilSquareIcon,
    TrashIcon,
    PhoneIcon,
    UserGroupIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    EllipsisVerticalIcon,
    CheckIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    ShareIcon
} from '@heroicons/vue/24/outline'

// Configuración de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Importar componentes y funciones de notificación
import Notification from '@/components/shared/Notification.vue'
import { notificationState, showNotification, hideNotification } from '@/events/notificationEvents.ts'

// Estados reactivos
const pasajeros = ref([])
const guardando = ref(false) // Indica si una operación de guardado/actualización está en curso
const tabActiva = ref('registro') // 'registro', 'bus1', 'bus2'
const filtroNombre = ref('') // Para el buscador
const notaEnModal = ref(null) // Controla qué nota se muestra en el modal
const pasajeroALlamar = ref(null) // Controla el modal de llamada
const pasajeroAEliminar = ref(null) // Controla el modal de eliminación
const activeMenuId = ref(null) // ID del pasajero con menú abierto
const mostrarModalReinicio = ref(false) // Modal de reinicio general
const deferredPrompt = ref(null) // Evento de instalación PWA
const showInstallPrompt = ref(false) // Visibilidad del banner
const formulario = ref({
    nombre: '',
    telefono: '',
    bus_asignado: 1,
    nota: ''
})

const editandoPasajeroId = ref(null) // Almacena el ID del pasajero que se está editando
// Filtrar pasajeros por cada bus de forma eficiente
const pasajerosBus1 = computed(() => {
    return pasajeros.value
        .filter(p => p.bus_asignado === 1)
        .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
})
const pasajerosBus2 = computed(() => {
    return pasajeros.value
        .filter(p => p.bus_asignado === 2)
        .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
})

// Lógica de búsqueda combinada con la pestaña activa
const pasajerosFiltrados = computed(() => {
    const listaBase = tabActiva.value === 'bus1' ? pasajerosBus1.value : pasajerosBus2.value
    if (!filtroNombre.value.trim()) return listaBase

    const query = filtroNombre.value.toLowerCase()
    return listaBase.filter(p =>
        p.nombre_completo.toLowerCase().includes(query)
    )
})

// Estadísticas de asistencia basadas en la pestaña activa
const statsAsistencia = computed(() => {
    const lista = tabActiva.value === 'bus1' ? pasajerosBus1.value : pasajerosBus2.value
    const asistieron = lista.filter(p => p.asistio).length
    return {
        asistieron,
        faltan: lista.length - asistieron,
        total: lista.length
    }
})

// Obtener la lista inicial de pasajeros de la base de datos
const cargarPasajeros = async () => {
    const { data, error } = await supabase
        .from('pasajeros')
        .select('*')
        .order('creado_en', { ascending: false })

    if (!error) pasajeros.value = data
}

// Escuchar inserciones en Tiempo Real
const activarTiempoReal = () => {
    supabase
        .channel('cambios-pasajeros')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pasajeros' }, (payload) => {
            const { eventType, new: newRow, old: oldRow } = payload
            console.log('Cambio detectado:', eventType, payload)

            if (eventType === 'INSERT') {
                pasajeros.value = [newRow, ...pasajeros.value]
            } else if (eventType === 'UPDATE') {
                const index = pasajeros.value.findIndex(p => p.id === newRow.id)
                if (index !== -1) {
                    // Usamos splice para asegurar que Vue detecte el cambio de objeto profundo
                    pasajeros.value.splice(index, 1, newRow)
                }
            } else if (eventType === 'DELETE') {
                pasajeros.value = pasajeros.value.filter(p => p.id !== oldRow.id)
            }
        })
        .subscribe()
}

// Función para limpiar y resetear el formulario
const resetFormulario = () => {
    formulario.value = {
        nombre: '',
        telefono: '',
        bus_asignado: formulario.value.bus_asignado, // Mantiene el bus seleccionado
        nota: ''
    }
    editandoPasajeroId.value = null
}

// Validadores en tiempo real
const validarNombre = () => {
    // Remueve números y convierte a mayúsculas
    formulario.value.nombre = formulario.value.nombre
        .replace(/[0-9]/g, '')
        .toUpperCase()
}

const validarTelefono = () => {
    // Remueve todo lo que no sea número
    formulario.value.telefono = formulario.value.telefono.replace(/\D/g, '')
}

// Guardar (insertar o actualizar) un pasajero
const guardarPasajero = async () => {
    if (guardando.value) return
    guardando.value = true

    // Guardar el bus de destino para redireccionar después
    const busDestino = formulario.value.bus_asignado

    // Validar que el nombre no esté vacío
    if (!formulario.value.nombre.trim()) {
        showNotification('El nombre del pasajero no puede estar vacío.', 'alert-warning')
        guardando.value = false
        return
    }

    const nombreLimpio = formulario.value.nombre
        .trim()
        .replace(/\s+/g, ' ') // Cambia múltiples espacios por uno solo
        .toUpperCase()        // Todo a mayúsculas para homogeneidad

    const datosAEnviar = {
        nombre_completo: nombreLimpio,
        bus_asignado: formulario.value.bus_asignado,
        telefono: formulario.value.telefono.trim() || null,
        asistio: false, // Por defecto al registrar
        nota: formulario.value.nota.trim() || null
    }

    let error = null

    if (editandoPasajeroId.value) {
        // Modo edición: Actualizar pasajero existente
        const { error: updateError } = await supabase
            .from('pasajeros')
            .update(datosAEnviar)
            .eq('id', editandoPasajeroId.value)
        error = updateError
    } else {
        // Modo registro: Insertar nuevo pasajero
        const { error: insertError } = await supabase
            .from('pasajeros')
            .insert([datosAEnviar])
        error = insertError
    }

    guardando.value = false

    if (error) {
        if (error.code === '23505') {
            showNotification(`El pasajero "${nombreLimpio}" ya está registrado.`, 'alert-warning')
        } else {
            showNotification(`Error al guardar pasajero: ${error.message}`, 'alert-error')
        }
        return
    }

    showNotification(`Pasajero ${editandoPasajeroId.value ? 'actualizado' : 'registrado'} con éxito.`, 'alert-success')

    // Si estábamos editando, regresamos a la lista del bus correspondiente
    if (editandoPasajeroId.value) {
        tabActiva.value = 'bus' + busDestino
    }
    resetFormulario()
}

// Cargar datos de un pasajero al formulario para edición
const editarPasajero = (pasajero) => {
    editandoPasajeroId.value = pasajero.id
    formulario.value = {
        nombre: pasajero.nombre_completo,
        telefono: pasajero.telefono || '',
        bus_asignado: pasajero.bus_asignado,
        nota: pasajero.nota || ''
    }
    // Cambiar a la pestaña de registro para editar
    tabActiva.value = 'registro'
    // Desplazar la vista al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Cancelar el modo edición y limpiar el formulario
const cancelarEdicion = () => {
    resetFormulario()
    showNotification('Edición cancelada.', 'alert-info')
}

// Iniciar flujo de eliminación
const eliminarPasajero = (pasajero) => {
    pasajeroAEliminar.value = pasajero
}

const confirmarEliminacionDefinitiva = async () => {
    const id = pasajeroAEliminar.value.id
    const { error } = await supabase
        .from('pasajeros')
        .delete()
        .eq('id', id)

    if (error) {
        showNotification(`Error al eliminar pasajero: ${error.message}`, 'alert-error')
        return
    }

    pasajeroAEliminar.value = null
    showNotification('Pasajero eliminado con éxito.', 'alert-success')

    // Si el pasajero eliminado era el que se estaba editando, cancelar edición
    if (editandoPasajeroId.value === id) {
        cancelarEdicion()
    }
}

// Marcar/Desmarcar asistencia individual
const toggleAsistencia = async (pasajero) => {
    const nuevoEstado = !pasajero.asistio
    const { error } = await supabase
        .from('pasajeros')
        .update({ asistio: nuevoEstado })
        .eq('id', pasajero.id)

    if (error) {
        showNotification(`Error al actualizar asistencia: ${error.message}`, 'alert-error')
    } else {
        const msg = nuevoEstado ? 'Pasajero subió al bus' : 'Asistencia anulada'
        showNotification(msg, 'alert-info')
    }
}

// Lógica de reinicio general por bus
const confirmarReinicioGeneral = () => {
    mostrarModalReinicio.value = true
}

const ejecutarReinicioGeneral = async () => {
    const busId = tabActiva.value === 'bus1' ? 1 : 2

    const { error } = await supabase
        .from('pasajeros')
        .update({ asistio: false })
        .eq('bus_asignado', busId)

    if (error) {
        showNotification(`Error al reiniciar lista: ${error.message}`, 'alert-error')
    } else {
        showNotification('Lista reiniciada correctamente.', 'alert-success')
    }
    mostrarModalReinicio.value = false
}

// Lógica para instalación PWA
const handleBeforeInstallPrompt = (e) => {
    // Previene que el navegador muestre el prompt automático
    e.preventDefault()
    // Guarda el evento para dispararlo después
    deferredPrompt.value = e
    // Muestra el botón personalizado
    showInstallPrompt.value = true
}

const installPWA = async () => {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
        showInstallPrompt.value = false
    }
    deferredPrompt.value = null
}

// Función para compartir lista por WhatsApp
const compartirWhatsApp = (esResumenGeneral = false) => {
    let texto = ''

    if (esResumenGeneral) {
        texto = `*RESUMEN GENERAL - CONTROL DE PASAJEROS*\n`
        texto += `Total Registrados: ${pasajeros.value.length}\n`
        texto += `--------------------------\n`
        texto += `🚌 BUS 1: ${pasajerosBus1.value.length} personas\n`
        texto += `🚌 BUS 2: ${pasajerosBus2.value.length} personas\n`
        texto += `\n_Respaldo al Dr. Roldán Díaz_`
    } else {
        const busNum = tabActiva.value.at(-1)
        const lista = tabActiva.value === 'bus1' ? pasajerosBus1.value : pasajerosBus2.value

        if (lista.length === 0) {
            showNotification('La lista está vacía', 'alert-warning')
            return
        }

        texto = `*LISTA DE PASAJEROS - BUS ${busNum}*\n`
        texto += `Total: ${lista.length} | Subieron: ${statsAsistencia.value.asistieron}\n`
        texto += `--------------------------\n\n`

        lista.forEach((p, index) => {
            const check = p.asistio ? '✅ ' : '🏷️ '
            texto += `${index + 1}. ${check}${p.nombre_completo}`
            if (p.telefono) texto += ` (${p.telefono})` + '\n'
            if (p.nota) texto += ` - _[${p.nota}]_` + '\n'
            texto += '\n'
        })

        texto += `\n_Huaca Blanca 2026 💚🧡_`
    }

    const encodedText = encodeURIComponent(texto)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
}

// Iniciar procesos al montar la aplicación
onMounted(() => {
    cargarPasajeros()
    activarTiempoReal()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

// Directiva para detectar clics fuera de un elemento (para cerrar el menú)
const vClickOutside = {
    mounted(el, binding) {
        el.clickOutsideEvent = (event) => {
            if (!(el === event.target || el.contains(event.target))) {
                binding.value()
            }
        }
        document.body.addEventListener('click', el.clickOutsideEvent)
    },
    unmounted(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent)
    }
}
</script>

<style scoped>
/* Animaciones */
.list-enter-active,
.list-leave-active,
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.list-move {
    transition: transform 0.3s ease;
}

/* Para evitar scroll horizontal en iOS */
html,
body {
    overflow-x: hidden;
    overscroll-behavior-y: contain;
}
</style>