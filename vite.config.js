import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    {
      name: 'multi-page-clean-urls',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ? req.url.split('?')[0] : '';
          const routes = ['/admin', '/coordinator', '/judges', '/leader'];
          if (routes.includes(url)) {
            const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
            req.url = `${url}.html${query}`;
          }
          next();
        });
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        coordinator: resolve(__dirname, 'coordinator.html'),
        judges: resolve(__dirname, 'judges.html'),
        leader: resolve(__dirname, 'leader.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/gsap')) {
            return 'gsap-vendor';
          }
          if (id.includes('node_modules/ogl')) {
            return 'ogl-vendor';
          }
        },
      },
    },
  },
});
