import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'login-id':                  resolve(__dirname, 'screens/login-id.js'),
        'signup-id':                 resolve(__dirname, 'screens/signup-id.js'),
        'login-password':            resolve(__dirname, 'screens/login-password.js'),
        'signup-password':           resolve(__dirname, 'screens/signup-password.js'),
        'email-identifier-challenge': resolve(__dirname, 'screens/email-identifier-challenge.js'),
        'email-otp-challenge':       resolve(__dirname, 'screens/email-otp-challenge.js'),
        'passkey-enrollment':        resolve(__dirname, 'screens/passkey-enrollment.js'),
        'organization-selection':    resolve(__dirname, 'screens/organization-selection.js'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        // Shared chunk (themes.js) — hosted in the same dist/ directory.
        // Auth0 loads the entry with type="module" so the browser resolves
        // the relative import to the chunk automatically.
        chunkFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
