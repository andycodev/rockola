export interface Mesa {
    id: string
    numero_mesa: string
    token_actual: string
    creado_en: string
}

export interface Cancion {
    id: number
    mesa_id: string
    youtube_video_id: string
    titulo: string
    miniatura: string
    estado: 'pendiente' | 'reproduciendo' | 'completada' | 'saltada'
    creado_en: string
}

export interface VideoBusqueda {
    videoId: string
    title: string
    thumbnail: string
}

export interface SesionLocal {
    mesaId: string
    token: string
    horaIngreso: number
}