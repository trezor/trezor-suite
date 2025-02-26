import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Plugin, ViteDevServer, defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from 'vite-plugin-wasm';

import { suiteVersion } from '../../suite/package.json';
import { assetPrefix, project } from '../utils/env';

// Plugin to serve static files with /static prefix
const staticAliasPlugin = (): Plugin => ({
    name: 'static-alias',
    configureServer(server: ViteDevServer) {
        // Middleware to handle /static requests
        server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/static/')) {
                // Rewrite the URL to access the file from the public directory
                req.url = req.url.replace('/static/', '/');
            }
            next();
        });
    },
});

// Plugin to serve core.js in dev mode
const serveCorePlugin = () => ({
    name: 'serve-core',
    configureServer(server: ViteDevServer) {
        server.middlewares.use(async (req, res, next) => {
            if (req.url?.endsWith('/js/core.js')) {
                const code = await server.transformRequest(
                    resolve(__dirname, '../../connect/src/core/index.ts'),
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

// Plugin to handle workers similar to webpack's worker-loader
const workerPlugin = (): Plugin => ({
    name: 'worker-loader',
    transform(code, id) {
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

// This helper creates aliases for all workspace packages
const createWorkspaceAliases = () => {
    const suiteCommonAliases = Object.fromEntries(
        readdirSync(resolve(__dirname, '../../../suite-common'), { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => [
                `@suite-common/${dirent.name}`,
                resolve(__dirname, '../../../suite-common', dirent.name),
            ]),
    );

    const trezorPackagesAliases = Object.fromEntries(
        readdirSync(resolve(__dirname, '../../'), { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name !== 'suite-web')
            .map(dirent => [`@trezor/${dirent.name}`, resolve(__dirname, '../../', dirent.name)]),
    );

    return {
        ...suiteCommonAliases,
        ...trezorPackagesAliases,
    };
};

const commitId = execSync('git rev-parse HEAD').toString().trim();

export default defineConfig({
    root: resolve(__dirname, '../src'),
    base: assetPrefix,
    // Use suite-data/files as the public directory
    publicDir: resolve(__dirname, '../../suite-data/files'),
    plugins: [
        nodePolyfills(),
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
                find: /^@trezor\/connect(\/index)?$/,
                replacement: '@trezor/connect-web/src/module',
            },
            {
                find: 'src',
                replacement: resolve(__dirname, '../../suite/src'),
            },
            ...Object.entries(createWorkspaceAliases()).map(([find, replacement]) => ({
                find,
                replacement,
            })),
        ],
        preserveSymlinks: true,
    },
    define: {
        'process.browser': true,
        'process.env.VERSION': JSON.stringify(suiteVersion),
        'process.env.COMMIT_HASH': JSON.stringify(commitId),
        'process.env.COMMITHASH': JSON.stringify(commitId),
        'process.env.SUITE_TYPE': JSON.stringify(project),
        'process.env.NODE_ENV': JSON.stringify('development'),
        'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
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
        esbuildOptions: {
            define: {
                global: 'globalThis',
            },
            plugins: [
                {
                    name: 'commonjs',
                    setup(build) {
                        build.onLoad({ filter: /\.js$/ }, args => {
                            if (args.path.includes('packages/')) {
                                return {
                                    format: 'cjs',
                                    loader: 'js',
                                };
                            }
                        });
                    },
                },
            ],
        },
    },
    build: {
        outDir: resolve(__dirname, '../../suite-web/build'),
    },
    server: {
        port: 8000,
        open: true,
        host: true,
    },
});
