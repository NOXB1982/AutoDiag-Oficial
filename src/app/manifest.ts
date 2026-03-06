import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'AutoDiag AI',
        short_name: 'AutoDiag',
        description: 'Sistema de Diagnóstico Auto com IA para Oficinas',
        start_url: '/',
        display: 'standalone',
        background_color: '#030712', // gray-950
        theme_color: '#84cc16', // lime-500
        icons: [
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            },
        ],
    }
}
