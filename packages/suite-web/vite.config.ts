import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Plugin, ViteDevServer, defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

import { suiteVersion } from '../suite/package.json';

// Use require instead of import for TypeScript files
const { assetPrefix, project } = require('../suite-build/utils/env');

// Plugin to serve static files with /static prefix
const staticAliasPlugin = (): Plugin => ({
    name: 'static-alias',
    configureServer(server: ViteDevServer) {
        // Middleware to handle /static requests
        server.middlewares.use((req, _res, next) => {
            if (req.url?.startsWith('/static/')) {
                // Rewrite the URL to access the file from the public directory
                req.url = req.url.replace('/static/', '/');
            }
            next();
        });
    },
});

// Function to process the HTML template with template variables
const processTemplate = (template: string): string =>
    template
        // Hardcoded replace for the only used webpack template variable. If we need more in future, we may develop a more generic code
        .replace(/<%=\s*assetPrefix\s*%>/g, assetPrefix)
        // Remove the webpack template conditional (opening + closing statements as well as the HTML in between)
        .replace(/<%\s*if\([^%]*%>[\s\S]*?<%\s*}\s*%>/g, '')
        // Add the script tag for vite-index.ts
        .replace('</head>', '<script type="module" src="./vite-index.ts"></script></head>')
        // Add the app div to the body
        .replace('</body>', '<div id="app"></div></body>');

// Custom plugin to use the same template as webpack
const htmlTemplatePlugin = (): Plugin => ({
    name: 'transform-html',
    // This hook runs before Vite processes the HTML
    transformIndexHtml: {
        order: 'pre',
        handler: (html: string) => processTemplate(html),
    },
});
// Plugin to handle workers similar to webpack's worker-loader
const workerPlugin = (): Plugin => ({
    name: 'worker-loader',
    transform(_code, id) {
        if (/\/workers\/[^/]+\/index\.ts$/.test(id)) {
            // Return a virtual module that creates a web worker
            return {
                code: `
                    const worker = () => new Worker(new URL('${id}', import.meta.url), { type: 'module' });
                    export default worker;
                `,
                map: null,
            };
        }
    },
});

// Plugin to serve core.js in dev mode
const serveCorePlugin = () => ({
    name: 'serve-core',
    configureServer(server: ViteDevServer) {
        server.middlewares.use(async (req, res, next) => {
            if (req.url?.endsWith('/js/core.js')) {
                const code = await server.transformRequest(
                    resolve(__dirname, '../connect/src/core/index.ts'),
                    { ssr: false },
                );
                if (code?.code) {
                    res.setHeader('Content-Type', 'application/javascript');
                    res.end(code.code);

                    return;
                }
            }
            next();
        });
    },
});

// This helper creates aliases for all workspace packages
const createWorkspaceAliases = () => {
    const suiteCommonAliases = readdirSync(resolve(__dirname, '../../suite-common'), {
        withFileTypes: true,
    })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
            find: `@suite-common/${dirent.name}`,
            replacement: resolve(__dirname, '../../suite-common', dirent.name),
        }));

    const trezorPackagesAliases = readdirSync(resolve(__dirname, '../'), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name !== 'suite-web')
        .map(dirent => ({
            find: `@trezor/${dirent.name}`,
            replacement: resolve(__dirname, '../', dirent.name),
        }));

    return [...suiteCommonAliases, ...trezorPackagesAliases];
};

const commitId = execSync('git rev-parse HEAD').toString().trim();

// Plugin to inject Buffer polyfill code at the beginning of every module
const injectBufferPolyfillPlugin = (): Plugin => {
    const bufferPolyfillCode = `
// Ensure Buffer is available globally
import { Buffer as ImportedBuffer } from 'buffer';


// Define Buffer in all possible global scopes
if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || ImportedBuffer;
};

if (typeof global !== 'undefined') {
    global.Buffer = global.Buffer || ImportedBuffer;
};

if (typeof globalThis !== 'undefined') {
    globalThis.Buffer = globalThis.Buffer || ImportedBuffer;
};

// Make sure global is defined
if (typeof window !== 'undefined' && typeof global === 'undefined') {
    window.global = window;
};

// Make sure globalThis is defined
if (typeof window !== 'undefined' && typeof globalThis === 'undefined') {
    window.globalThis = window;
};
`;

    return {
        name: 'inject-buffer-polyfill',
        transform(code, id) {
            // Skip node_modules and non-JS/TS files
            if (!id.endsWith('.js') && !id.endsWith('.ts') && !id.endsWith('.tsx')) {
                return null;
            }

            // Inject the Buffer polyfill code at the beginning of the file
            return {
                code: bufferPolyfillCode + code,
                map: null,
            };
        },
    };
};

export default defineConfig({
    root: './src/static',
    base: assetPrefix,
    // Use suite-data/files as the public directory
    publicDir: resolve(__dirname, '../suite-data/files'),
    plugins: [
        htmlTemplatePlugin(),
        injectBufferPolyfillPlugin(),
        staticAliasPlugin(),
        serveCorePlugin(),
        viteCommonjs(),
        workerPlugin(),
        wasm(),
        react({
            babel: {
                plugins: [
                    [
                        'babel-plugin-styled-components',
                        {
                            displayName: true,
                            fileName: false,
                        },
                    ],
                ],
            },
        }),
    ],
    resolve: {
        alias: [
            {
                find: /@trezor\/connect$/,
                replacement: '@trezor/connect-web/src/module',
            },
            {
                find: 'src',
                replacement: resolve(__dirname, '../suite/src'),
            },
            {
                find: 'crypto',
                replacement: require.resolve('crypto-browserify'),
            },
            {
                find: 'buffer',
                replacement: require.resolve('buffer'),
            },
            {
                find: 'stream',
                replacement: require.resolve('stream-browserify'),
            },
            {
                find: 'vm',
                replacement: require.resolve('vm-browserify'),
            },
            ...createWorkspaceAliases(),
        ],
        preserveSymlinks: true,
    },
    define: {
        'process.browser': true,
        'process.env.VERSION': JSON.stringify(suiteVersion),
        'process.env.COMMIT_HASH': JSON.stringify(commitId),
        'process.env.COMMITHASH': JSON.stringify(commitId),
        'process.env.SUITE_TYPE': JSON.stringify(project ?? 'web'),
        'process.env.NODE_ENV': JSON.stringify('development'),
        'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
        global: 'globalThis',
        __DEV__: true,
        ENABLE_REDUX_LOGGER: true,
    },
    optimizeDeps: {
        include: ['@trezor/connect', '@trezor/suite', 'buffer'],
        exclude: [
            // Exclude WebAssembly modules
            '@trezor/crypto-utils',
            '@trezor/utxo-lib',
        ],
    },
    server: {
        port: 8000,
        open: true,
        host: true,
    },
});
