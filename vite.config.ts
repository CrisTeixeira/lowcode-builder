/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    // Vitest skips CSS by default; the HTML export embeds this file, so load it in tests too.
    css: { include: [/components\.css/] },
  },
})
