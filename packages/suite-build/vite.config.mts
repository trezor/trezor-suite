import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import { createRequire } from 'module';
import { resolve } from 'path';
import { Plugin, ViteDevServer, build, defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

import { suiteVersion } from '../suite/package.json';
import {
    assetPrefix,
    isTanstackReactQueryDevTools,
    project,
    transportBrowserPing,
} from './utils/env';
import { sharedAliases as alias, noopCoreJsPlugin, requireAssetPlugin } from './viteShared';

const require = createRequire(import.meta.url);

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

// Plugin to serve flag SVGs from `@suite-common/flags` at `/static/flags/*.svg`
// (flags moved out of `suite-data/files` so they need an explicit middleware +
// build-time copy).
const flagsPlugin = (): Plugin => {
    const flagsAssetsDir = resolve(
        require.resolve('@suite-common/flags/package.json'),
        '../assets/flags',
    );
    let outDir: string | null = null;

    return {
        name: 'suite-flags',
        enforce: 'pre',
        configResolved(config) {
            outDir = config.build.outDir;
        },
        configureServer(server: ViteDevServer) {
            server.middlewares.use((req, res, next) => {
                const match = req.url?.match(/^\/static\/flags\/([a-z0-9-]+\.svg)$/i);
                if (!match) {
                    next();

                    return;
                }
                // @ts-expect-error: noUncheckedIndexedAccess
                const secondMatch: string = match[1];
                const filePath = resolve(flagsAssetsDir, secondMatch.toLowerCase());
                if (!fs.existsSync(filePath)) {
                    next();

                    return;
                }
                res.setHeader('Content-Type', 'image/svg+xml');
                fs.createReadStream(filePath).pipe(res);
            });
        },
        closeBundle() {
            if (!outDir) return;
            const dest = resolve(outDir, 'static/flags');
            fs.mkdirSync(dest, { recursive: true });
            fs.cpSync(flagsAssetsDir, dest, { recursive: true });
        },
    };
};

// Function to process the HTML template with template variables
const processTemplate = (template: string): string =>
    template
        // Hardcoded replace for the only used webpack template variable. If we need more in future, we may develop a more generic code
        .replace(/<%=\s*assetPrefix\s*%>/g, assetPrefix)
        // Remove the webpack template conditional (opening + closing statements as well as the HTML in between)
        .replace(/<%\s*if\([^%]*%>[\s\S]*?<%\s*}\s*%>/g, '')
        // Add the script tag for vite-index.ts
        .replace('</head>', '<script type="module" src="./vite-index.ts"></script></head>');

// Custom plugin to use the same template as webpack
const htmlTemplatePlugin = (): Plugin => ({
    name: 'transform-html',
    // This hook runs before Vite processes the HTML
    transformIndexHtml: {
        order: 'pre',
        handler: (html: string) => processTemplate(html),
    },
});

// Plugin to serve sessions-background-sharedworker.js as a complete bundle to be used directly as a web worker
const sessionsSharedWorkerPlugin = () => {
    const workerOutDir = resolve(__dirname, '../suite-web/dist/workers');
    const workerEntryPath = resolve(
        __dirname,
        '../transport-web/src/sessions/background-sharedworker.ts',
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

// Plugin to resolve bare module specifiers (e.g. @trezor/blockchain-link/src/workers/blockbook)
// inside new Worker(new URL(..., import.meta.url)) calls.
// In dev mode, Vite doesn't bundle — the browser constructs the URL at runtime and has no way to
// resolve bare package specifiers, so we must expand them to /@fs/ paths that the dev server
// can serve directly. In production, rolldown resolves them through the alias config at build time.
const resolveWorkerUrlsPlugin = (): Plugin => ({
    name: 'resolve-worker-urls',
    enforce: 'pre',
    apply: 'serve',
    transform(code) {
        if (!code.includes('new Worker') || !code.includes('import.meta.url')) return null;

        let changed = false;
        const transformed = code.replace(
            /new URL\(\s*(?:\/\*.*?\*\/)?\s*(['"])(@[^'"]+)\1,\s*import\.meta\.url,?\s*\)/gm,
            (match, _quote, specifier) => {
                for (const a of alias) {
                    if (
                        typeof a.find === 'string' &&
                        typeof a.replacement === 'string' &&
                        specifier.startsWith(a.find)
                    ) {
                        const rest = specifier.slice(a.find.length);
                        const abs = a.replacement + rest;
                        // Append index.ts if no file extension present
                        const withExt = /\.[cm]?[jt]sx?$/.test(abs) ? abs : `${abs}/index.ts`;
                        changed = true;

                        return `new URL('/@fs${withExt}', import.meta.url)`;
                    }
                }

                return match;
            },
        );

        return changed ? { code: transformed, map: null } : null;
    },
});

const commitId = execSync('git rev-parse HEAD').toString().trim();

// Plugin to provide Buffer polyfill via a virtual module
const bufferPolyfillPlugin = (): Plugin => {
    const virtualModuleId = 'virtual:buffer-polyfill';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    // The implementation lives in browserPolyfills.ts so the component-test gallery installs the
    // exact same polyfills; the package specifier resolves through the workspace aliases.
    const polyfillCode = `
import { installBrowserPolyfills } from '@trezor/suite-build/browserPolyfills';
installBrowserPolyfills();
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
        requireAssetPlugin(),
        flagsPlugin(),
        staticAliasPlugin(),
        sessionsSharedWorkerPlugin(),
        faviconPlugin(),
        viteCommonjs(),
        resolveWorkerUrlsPlugin(),
        wasm(),
        react(),
        babel({
            plugins: [
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
        'process.env.TRANSPORT_BROWSER_PING': JSON.stringify(transportBrowserPing),
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
