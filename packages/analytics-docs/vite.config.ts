import react from '@vitejs/plugin-react';
import { type Plugin, defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Plugin to transform require() for SVG files in icons.ts to ESM-compatible import.meta.url
const iconsRequirePlugin = (): Plugin => ({
    name: 'icons-require-plugin',
    enforce: 'pre',
    transform(code, id) {
        const cleanId = id.split('?')[0];
        if (!cleanId.replace(/\\/g, '/').includes('suite-common/icons/src/icons.ts')) {
            return null;
        }

        const transformed = code.replace(
            /require\((['"`])([^'"`]+\.svg)\1\)/g,
            'new URL($1$2$1, import.meta.url).href',
        );

        return {
            code: transformed,
            map: null,
        };
    },
});

/* eslint-disable-next-line import/no-default-export */
export default defineConfig({
    base: process.env.BASE_PATH ?? '/',
    plugins: [
        iconsRequirePlugin(),
        react(),
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            protocolImports: true,
        }),
    ],
    server: {
        port: 5180,
    },
});
