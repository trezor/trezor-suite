import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { execSync } from 'child_process';
import fs, { readdirSync } from 'fs';
import { createRequire } from 'module';
import { resolve } from 'path';
import { Plugin, ViteDevServer, build, defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

import { suiteVersion } from '../suite/package.json';
import { assetPrefix, isTanstackReactQueryDevTools, project } from './utils/env';

const require = createRequire(import.meta.url);

// Shared build-time config lives at repo root; CJS require avoids TS rootDir inclusion.
const { reactCompilerPlugin } = require('../../react-compiler.config');

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

const trezorLogosRequirePlugin = (): Plugin => ({
    name: 'trezor-logos-require',
    enforce: 'pre',
    transform(code, id) {
        const cleanId = id.split('?')[0];
        if (
            !cleanId.includes(
                'packages/product-components/src/components/TrezorLogo/trezorLogos.ts',
            )
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

    const suiteAliases = readdirSync(resolve(__dirname, '../../suite'), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
            find: `@suite/${dirent.name}`,
            replacement: resolve(__dirname, '../../suite', dirent.name),
        }));

    return [...suiteCommonAliases, ...trezorPackagesAliases, ...suiteAliases];
};

const alias = [
    {
        find: 'core-js/actual',
        replacement: 'noop-core-js-actual',
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
                    rolldownOptions: {
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

// Plugin to build favicon.js from suite-data for /static/favicon.js usage
const faviconPlugin = (): Plugin => {
    const faviconOutDir = resolve(__dirname, '../suite-data/files');
    const faviconEntryPath = resolve(__dirname, '../suite-data/src/favicon.ts');
    const faviconFileName = 'favicon.js';
    const faviconOutputPath = resolve(faviconOutDir, faviconFileName);

    let buildInFlight: Promise<string | null> | null = null;
    let hasBuilt = false;

    const buildFavicon = () => {
        if (buildInFlight) {
            return buildInFlight;
        }

        buildInFlight = (async () => {
            if (!fs.existsSync(faviconOutDir)) {
                fs.mkdirSync(faviconOutDir, { recursive: true });
            }

            console.log(`Building favicon from ${faviconEntryPath}...`);

            try {
                await build({
                    configFile: false,
                    resolve: {
                        alias,
                    },
                    build: {
                        outDir: faviconOutDir,
                        emptyOutDir: false,
                        lib: {
                            entry: faviconEntryPath,
                            formats: ['iife'],
                            fileName: () => faviconFileName,
                            name: 'TrezorSuiteFavicon',
                        },
                        rolldownOptions: {
                            output: {
                                inlineDynamicImports: true,
                            },
                        },
                        minify: true,
                        target: 'es2020',
                        write: true,
                    },
                    define: {
                        'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
                        'process.env.NODE_ENV': JSON.stringify(
                            process.env.NODE_ENV ?? 'development',
                        ),
                    },
                });

                console.log(`Favicon built successfully at ${faviconOutputPath}`);
                hasBuilt = true;

                return faviconOutputPath;
            } catch (error) {
                console.error('Failed to build favicon:', error);

                return null;
            } finally {
                buildInFlight = null;
            }
        })();

        return buildInFlight;
    };

    return {
        name: 'favicon-build',
        async configureServer(server: ViteDevServer) {
            if (!hasBuilt) {
                await buildFavicon();
            }

            server.watcher.add(faviconEntryPath);
            server.watcher.on('change', async (changedPath: string) => {
                if (changedPath === faviconEntryPath) {
                    console.log('Favicon source changed, rebuilding...');
                    await buildFavicon();
                }
            });
        },
        async buildStart() {
            if (!hasBuilt) {
                await buildFavicon();
            }
        },
    };
};

// Plugin to handle workers similar to webpack's worker-loader
const workerPlugin = (): Plugin => ({
    name: 'worker-loader',
    transform(_code, id) {
        if (/\/workers\/[^/]+\/index\.ts$/.test(id) || /pinger\/pingWorker.ts$/.test(id)) {
            // Return a virtual module that creates a web worker
            console.log('[VITE] Transforming worker:', id);

            return {
                code: `
                    const worker = () => {
                        console.log('[VITE] Creating worker from:', '${id}');
                        return new Worker(new URL('${id}', import.meta.url), { type: 'module' });
                    };
                    export default worker;
                `,
                // Use an empty source map to preserve the original file's mapping
                map: { mappings: '' },
            };
        }

        return null;
    },
});

const commitId = execSync('git rev-parse HEAD').toString().trim();

// Plugin to provide a no-op replacement for core-js/actual as a virtual module
const noopCoreJsPlugin = (): Plugin => {
    const virtualModuleId = 'noop-core-js-actual';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    return {
        name: 'noop-core-js-actual',
        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                return '// No-op replacement for core-js/actual\nexport default {};';
            }
        },
    };
};

// Plugin to provide Buffer polyfill via a virtual module
const bufferPolyfillPlugin = (): Plugin => {
    const virtualModuleId = 'virtual:buffer-polyfill';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    const polyfillCode = `
// Ensure Buffer is available globally
import { Buffer as ImportedBuffer } from 'buffer';

const base64UrlToBase64 = (input) => {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad === 0) return base64;
    return base64 + '='.repeat(4 - pad);
};

const base64ToBase64Url = (input) => input.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/g, '');

const patchBase64Url = (BufferCtor) => {
    if (!BufferCtor?.prototype?.toString) return;

    const originalToString = BufferCtor.prototype.toString;
    if (!BufferCtor.prototype.__trezorPatchedBase64UrlToString) {
        Object.defineProperty(BufferCtor.prototype, '__trezorPatchedBase64UrlToString', {
            value: true,
            enumerable: false,
        });
        BufferCtor.prototype.toString = function (encoding, start, end) {
            if (encoding === 'base64url') {
                return base64ToBase64Url(originalToString.call(this, 'base64', start, end));
            }
            return originalToString.call(this, encoding, start, end);
        };
    }

    const originalFrom = BufferCtor.from;
    if (!BufferCtor.__trezorPatchedBase64UrlFrom) {
        Object.defineProperty(BufferCtor, '__trezorPatchedBase64UrlFrom', {
            value: true,
            enumerable: false,
        });
        BufferCtor.from = function (value, encodingOrOffset, length) {
            if (encodingOrOffset === 'base64url' && typeof value === 'string') {
                return originalFrom.call(this, base64UrlToBase64(value), 'base64');
            }
            return originalFrom.call(this, value, encodingOrOffset, length);
        };
    }
};

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

patchBase64Url(ImportedBuffer);
if (typeof window !== 'undefined' && window.Buffer) patchBase64Url(window.Buffer);
if (typeof global !== 'undefined' && global.Buffer) patchBase64Url(global.Buffer);
if (typeof globalThis !== 'undefined' && globalThis.Buffer) patchBase64Url(globalThis.Buffer);

// Make sure global is defined
if (typeof window !== 'undefined' && typeof global === 'undefined') {
    window.global = window;
};

// Make sure globalThis is defined
if (typeof window !== 'undefined' && typeof globalThis === 'undefined') {
    window.globalThis = window;
};
// Polyfill process.nextTick for jws.createVerify
if (
    typeof window !== 'undefined' &&
    typeof window.process !== 'undefined' &&
    typeof window.process.nextTick === 'undefined'
) {
    window.process.nextTick = cb => Promise.resolve().then(cb);
}

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

// TODO: after migration to Vite, remove this completely and FIX THE GUIDE LOADING
// Temporary and hacky plugin to handle the markdown guide apperance in vite dev env
// It finds and transforms the code to use fetch instead of imports so
// when we run vite dev the .md files are properly loaded
const guideMarkdownPlugin = (): Plugin => ({
    name: 'guide-md-dev',
    apply: 'serve',
    enforce: 'pre',
    transform(code, id) {
        if (!id.endsWith('useGuideLoadArticle.ts')) return null;

        // This transform the hook logic to use fetch so that
        // with Vite build md guides are displayed properly
        const transformed = code.replace(
            /const\s+file\s*=\s*await\s*import\([^)]*`@trezor\/suite-data\/files\/guide\/\$\{language\.toLowerCase\(\)\}\$\{id\}`[^)]*\);\s*const\s+md\s*=\s*(?:await\s*)?file\.default;?\s*return\s+md;?/s,
            `
const response = await fetch(\`/guide/\${language.toLowerCase()}\${id}\`);
if (!response.ok) throw new Error('Failed to load markdown');
return await response.text();
          `.trim(),
        );

        return {
            code: transformed,
            map: null,
        };
    },
});

export default defineConfig({
    root: '../suite-web/src/static',
    cacheDir: resolve(__dirname, '../../node_modules/.vite'),
    base: assetPrefix,
    // Use suite-data/files as the public directory
    publicDir: resolve(__dirname, '../suite-data/files'),
    plugins: [
        htmlTemplatePlugin(),
        bufferPolyfillPlugin(),
        noopCoreJsPlugin(),
        guideMarkdownPlugin(),
        trezorLogosRequirePlugin(),
        staticAliasPlugin(),
        sessionsSharedWorkerPlugin(),
        faviconPlugin(),
        viteCommonjs(),
        workerPlugin(),
        wasm(),
        react(),
        babel({
            plugins: [
                // React Compiler must run before styled-components.
                reactCompilerPlugin,
                [
                    'babel-plugin-styled-components',
                    {
                        displayName: true,
                        fileName: false,
                    },
                ],
            ],
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
        'process.env.TANSTACK_REACT_QUERY_DEV_TOOLS': JSON.stringify(isTanstackReactQueryDevTools),
        global: 'globalThis',
        __DEV__: true,
        ENABLE_REDUX_LOGGER: true,
    },
    optimizeDeps: {
        include: ['@trezor/suite', 'buffer'],
        exclude: [
            // Exclude WebAssembly modules
            '@trezor/crypto-utils',
            '@trezor/utxo-lib',
            // Exclude connect and transport to prevent pre-bundling issues with bridge URL construction and exports
            '@trezor/connect',
            '@trezor/transport',
        ],
    },
    server: {
        port: 8000,
        open: false,
        host: true,
        watch: {
            ignored: ['**/node_modules/**', '**/dist/**', '**/.nx/**', '**/.git/**'],
        },
    },
});
