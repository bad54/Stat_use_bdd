export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    public: {
      appName: 'ICN Database Usage Dashboard',
      appVersion: '0.1.0',
    },
  },

  nitro: {
    experimental: {
      openAPI: false,
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  vite: {
    optimizeDeps: {
      include: ['echarts', 'vue-echarts'],
    },
  },

  app: {
    head: {
      title: 'ICN Database Usage Dashboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Tableau de bord des statistiques de consultation des bases de données - ICN Business School' },
      ],
    },
  },
})
