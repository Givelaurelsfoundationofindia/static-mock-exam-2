import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// GTST+ Static Student Exam Portal (Standalone - No Backend or Database Required)
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 5180,
  },
})
