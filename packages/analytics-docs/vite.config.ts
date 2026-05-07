import react from '@vitejs/plugin-react';
import { type Plugin, defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Plugin to transform require() for SVG files to ESM-compatible import.meta.url
const svgRequirePlugin = (): Plugin => ({
    name: 'svg-require-plugin',
    enforce: 'pre',
    transform(code, id) {
        const cleanId = id.split('?')[0].replace(/\\/g, '/');
        if (
            !cleanId.includes('suite-common/icons/src/icons.ts') &&
            !cleanId.includes('suite-common/illustrations/src/illustrations.ts')
        ) {
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
        svgRequirePlugin(),
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
