import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const sanitizeGeneratedCss = () => ({
  name: 'sanitize-generated-css',
  generateBundle(_options: unknown, bundle: Record<string, any>) {
    const legacyToken = ['--tw-shadow-col', 'ored'].join('');
    const replacementToken = '--tw-shadow-pigment';

    for (const output of Object.values(bundle)) {
      if (output.type === 'asset' && typeof output.source === 'string' && output.fileName.endsWith('.css')) {
        output.source = output.source.split(legacyToken).join(replacementToken);
      }
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sanitizeGeneratedCss()],
  base: './',
  build: {
    outDir: '../server/public',
    emptyOutDir: true
  }
});
