
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'NO.IA - Finance Manager',
        short_name: 'NO.IA',
        description: 'Advanced Real Estate Financial Management',
        start_url: '/',
        display: 'standalone',
        background_color: '#09090b', // Matches dark mode background
        theme_color: '#09090b',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
