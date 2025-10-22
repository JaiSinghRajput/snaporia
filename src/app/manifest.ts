import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Snaporia',
        short_name: 'Snaporia',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        description: 'Discover and share moments on Snaporia',
        background_color: '#0B0B0F',
        theme_color: '#4F46E5',
        orientation: "portrait-primary",
        categories: ['social', 'photo'],
        icons: [
            {
                src: '/AppImages/android/android-launchericon-48-48.png',
                type: 'image/png',
                sizes: '48x48',
                purpose: 'any',
            },
            {
                src: '/AppImages/android/android-launchericon-72-72.png',
                type: 'image/png',
                sizes: '72x72',
                purpose: 'any',
            },
            {
                src: '/AppImages/android/android-launchericon-96-96.png',
                type: 'image/png',
                sizes: '96x96',
                purpose: 'any',
            },
            {
                src: '/AppImages/android/android-launchericon-144-144.png',
                type: 'image/png',
                sizes: '144x144',
                purpose: 'any',
            },
            {
                src: '/AppImages/android/android-launchericon-192-192.png',
                type: 'image/png',
                sizes: '192x192',
                purpose: 'any',
            },
            {
                src: '/AppImages/android/android-launchericon-512-512.png',
                type: 'image/png',
                sizes: '512x512',
                purpose: 'any',
            },
            {
                src: '/AppImages/android/android-launchericon-192-192.png',
                type: 'image/png',
                sizes: '192x192',
                purpose: 'maskable',
            },
            {
                src: '/AppImages/android/android-launchericon-512-512.png',
                type: 'image/png',
                sizes: '512x512',
                purpose: 'maskable',
            },
        ],
    }
}
