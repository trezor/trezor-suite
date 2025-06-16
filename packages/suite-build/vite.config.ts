import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs, { readdirSync } from 'fs';
import { resolve } from 'path';
import { Plugin, ViteDevServer, build, defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

import { suiteVersion } from '../suite/package.json';
import { assetPrefix, project } from './utils/env';

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
        // Add the app div to the body, the browser detection does work in vite
        .replace('</body>', '<div id="app"></div></body>')
        // in case if the id="app" is added multiple times
        .replace('<div id="app"></div><div id="app"></div>', '<div id="app"></div>');

// Custom plugin to use the same template as webpack
const htmlTemplatePlugin = (): Plugin => ({
    name: 'transform-html',
    // This hook runs before Vite processes the HTML
    transformIndexHtml: {
        order: 'pre',
        handler: (html: string) => processTemplate(html),
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

const alias = [
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
];

// Plugin to serve sessions-background-sharedworker.js as a complete bundle to be used directly as a web worker
const sessionsSharedWorkerPlugin = () => {
    const workerOutDir = resolve(__dirname, '../suite-web/dist/workers');
    const workerEntryPath = resolve(
        __dirname,
        '../transport/src/sessions/background-sharedworker.ts',
    );
    const workerFileName = 'sessions-background-sharedworker';
    const workerOutputPath = resolve(workerOutDir, `${workerFileName}.js`);

    let workerPath: string | null = null;

    const buildWorker = async () => {
        if (workerPath) {
            return workerPath;
        }
        if (!fs.existsSync(workerOutDir)) {
            fs.mkdirSync(workerOutDir, { recursive: true });
        }

        console.log(`Building shared worker from ${workerEntryPath}...`);

        try {
            await build({
                configFile: false,
                resolve: {
                    alias,
                },
                build: {
                    outDir: workerOutDir,
                    emptyOutDir: false,
                    lib: {
                        entry: workerEntryPath,
                        formats: ['iife'],
                        fileName: () => `${workerFileName}.js`,
                        name: 'TrezorSharedWorker',
                    },
                    rollupOptions: {
                        output: {
                            inlineDynamicImports: true,
                        },
                    },
                    minify: false,
                    target: 'es2020',
                    write: true,
                },
                define: {
                    'process.env.NODE_ENV': JSON.stringify('development'),
                },
            });

            console.log(`SharedWorker built successfully at ${workerOutputPath}`);
            workerPath = workerOutputPath;

            return workerPath;
        } catch (error) {
            console.error('Failed to build shared worker:', error);

            return null;
        }
    };

    return {
        name: 'sessions-shared-worker',
        async configureServer(server: ViteDevServer) {
            await buildWorker();

            server.watcher.add(workerEntryPath);
            server.watcher.on('change', async (changedPath: string) => {
                if (changedPath === workerEntryPath) {
                    console.log('Shared worker source changed, rebuilding...');
                    await buildWorker();
                }
            });

            // Create middleware to serve the built worker file
            server.middlewares.use(async (req, res, next) => {
                if (req.url && /workers\/sessions-background-sharedworker\.js/.test(req.url)) {
                    console.log('Serving shared worker from middleware');
                    const actualPath = await buildWorker();

                    try {
                        if (!actualPath) {
                            throw new Error('Failed to build shared worker!!');
                        }

                        if (fs.existsSync(actualPath)) {
                            const workerCode = fs.readFileSync(actualPath, 'utf-8');
                            res.setHeader('Content-Type', 'application/javascript');
                            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                            res.end(workerCode);

                            return;
                        } else {
                            throw new Error(`Worker file not found at ${actualPath}`);
                        }
                    } catch (error) {
                        console.error('Error serving shared worker:', error);
                        res.statusCode = 500;
                        res.end(`Error serving shared worker: ${error.message}`);

                        return;
                    }
                }
                next();
            });
        },
    };
};

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
                // Use an empty source map to preserve the original file's mapping
                map: { mappings: '' },
            };
        }

        return null;
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

const commitId = execSync('git rev-parse HEAD').toString().trim();

// Plugin to provide Buffer polyfill via a virtual module
const bufferPolyfillPlugin = (): Plugin => {
    const virtualModuleId = 'virtual:buffer-polyfill';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    const polyfillCode = `
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

// Export nothing - this module is only for side effects
export {};
`;

    return {
        name: 'buffer-polyfill',
        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                return polyfillCode;
            }
        },
        // Add import to the virtual module at the entry points
        transform(code, id) {
            // Only process entry points or index files
            if (id.includes('vite-index.ts') || id.includes('index.ts') || id.includes('main.ts')) {
                // Add import at the top of the file
                return {
                    code: `import '${virtualModuleId}';
${code}`,
                    map: { mappings: '' }, // Let Vite handle the source map
                };
            }
        },
    };
};

export default defineConfig({
    root: '../suite-web/src/static',
    cacheDir: resolve(__dirname, '../../node_modules/.vite'),
    base: assetPrefix,
    // Use suite-data/files as the public directory
    publicDir: resolve(__dirname, '../suite-data/files'),
    plugins: [
        htmlTemplatePlugin(),
        bufferPolyfillPlugin(),
        staticAliasPlugin(),
        serveCorePlugin(),
        sessionsSharedWorkerPlugin(),
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
        alias,
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
        open: false,
        host: true,
    },
});
