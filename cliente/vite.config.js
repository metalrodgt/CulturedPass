import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cabeceras de seguridad para el servidor de desarrollo / preview
// (en producción se configuran en el servidor que publique el frontend).
const cabecerasSeguridad = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Todo lo que empiece con /api se reenvía al backend (Node/Express en el puerto 3000).
// Así el navegador ve un solo origen: no hay problemas de CORS ni de cookies,
// y el sitio también funciona desde el celular usando la IP de tu computadora.
const proxyApi = {
  '/api': { target: 'http://localhost:3000', changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true, // permite abrirlo desde otros dispositivos de la red (celular)
    headers: cabecerasSeguridad,
    proxy: proxyApi,
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: true,
    headers: cabecerasSeguridad,
    proxy: proxyApi,
  },
});
