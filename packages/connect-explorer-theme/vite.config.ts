import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
    },
});
