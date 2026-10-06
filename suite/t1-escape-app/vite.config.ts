import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { type Plugin, defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { PRODUCTION_SECURITY_HEADERS } from './securityHeaders';

// The shared icon and illustration maps load their SVG files with require(), which a Vite
// ESM build cannot resolve. Rewrite those calls to URL imports.
const svgRequirePlugin = (): Plugin => ({
    name: 'svg-require-plugin',
    enforce: 'pre',
    transform(code, id) {
        const cleanId = id.split('?')[0]?.replace(/\\/g, '/') ?? '';
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

const resolveFromHere = (relativePath: string) =>
    fileURLToPath(new URL(relativePath, import.meta.url));

/* eslint-disable-next-line import/no-default-export */
export default defineConfig({
    base: process.env.BASE_PATH ?? '/',
    define: {
        // Shown in the diagnostic log, so that a reported log can be matched with the build.
        __APP_COMMIT__: JSON.stringify(process.env.GITHUB_SHA ?? 'local'),
    },
    plugins: [
        svgRequirePlugin(),
        react(),
        nodePolyfills({
            include: ['buffer', 'events', 'process', 'util'],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            protocolImports: true,
        }),
    ],
    resolve: {
        alias: {
            // @trezor/protocol re-exports THP, which imports Node's crypto. This app only speaks
            // protocol v1, so the module is replaced by a stub that fails loudly if it is ever
            // reached instead of shipping a full crypto polyfill.
            crypto: resolveFromHere('./src/stubs/nodeCrypto.ts'),
            // The blockbook worker imports the SOCKS agent for Tor support. The browser cannot
            // open raw sockets, so it gets the same stub blockchain-link ships for browsers.
            'socks-proxy-agent': resolveFromHere(
                '../../packages/blockchain-link/src/utils/socks-proxy-agent.ts',
            ),
        },
    },
    server: {
        port: 5181,
        // The desktop dev build of the bridge allows exactly this origin, so falling back to
        // another port would silently break device access.
        strictPort: true,
    },
    preview: {
        port: 5181,
        strictPort: true,
        headers: PRODUCTION_SECURITY_HEADERS,
    },
});
