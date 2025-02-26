import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
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

// Plugin to handle root path redirects
const rootRedirectPlugin = (): Plugin => ({
    name: 'root-redirect',
    configureServer(server: ViteDevServer) {
        server.middlewares.use((req, res, next) => {
            try {
                // If the request is for the root path, redirect to index.html
                if (req.url === '/' || req.url === '/index.html') {
                    req.url = '/index.html';
                }
                next();
            } catch (error) {
                console.error('Error in rootRedirectPlugin:', error);
                next(error);
            }
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

// Custom plugin to use the same template as webpack
const htmlTemplatePlugin = (templateParameters: Record<string, any>): Plugin => {
    const templatePath = resolve(__dirname, '../../suite-web/src/static/index.html');

    return {
        name: 'html-template',
        transformIndexHtml(html) {
            try {
                // Read the template file
                let template = readFileSync(templatePath, 'utf-8');

                // Make sure assetPrefix is defined
                if (!templateParameters.assetPrefix && templateParameters.assetPrefix !== '') {
                    console.warn('assetPrefix is undefined, setting to empty string');
                    templateParameters.assetPrefix = '';
                }

                const templateLiterals = template.match(/<%=\s*([^%]+?)\s*%>/g) || [];
                const templateLiteralsNoSpaces = template.match(/<%=([^%]+?)%>/g) || [];
                const allTemplateLiterals = [...templateLiterals, ...templateLiteralsNoSpaces];

                const processedVariables = new Set<string>();
                allTemplateLiterals.forEach(literal => {
                    // Extract the variable name from the template literal
                    const match =
                        literal.match(/<%=\s*([^%]+?)\s*%>/) || literal.match(/<%=([^%]+?)%>/);
                    if (!(match && match[1])) {
                        return;
                    }
                    const variableName = match[1].trim();

                    // Check if the variable exists in templateParameters
                    if (variableName in templateParameters) {
                        // Replace all occurrences of this literal with its value
                        const value =
                            templateParameters[variableName] !== undefined
                                ? templateParameters[variableName]
                                : '';

                        // Only log once per variable name
                        if (!processedVariables.has(variableName)) {
                            processedVariables.add(variableName);
                        }

                        // Replace all occurrences of this literal
                        template = template.replace(
                            new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                            value,
                        );
                    }
                });

                // Handle conditional statements <% if(condition) { %> content <% } %>
                template = template.replace(
                    /<%\s*if\(([^)]+)\)\s*{\s*%>([\s\S]*?)<%\s*}\s*%>/g,
                    (match, condition, content) => {
                        const key = condition.trim();

                        return templateParameters[key] ? content : '';
                    },
                );

                // Add the script tag for vite-index.ts
                template = template.replace(
                    '</head>',
                    '<script type="module" src="./vite-index.ts"></script></head>',
                );

                // Add the app div to the body
                template = template.replace('</body>', '<div id="app"></div></body>');

                return template;
            } catch (error) {
                console.error('Error in htmlTemplatePlugin:', error);

                // Return the original HTML if there's an error
                return html;
            }
        },
    };
};

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
    publicDir: resolve(__dirname, '../../../suite-data/files'),
    // Specify a custom cache directory
    cacheDir: resolve(__dirname, './.vite'),
    plugins: [
        nodePolyfills(),
        staticAliasPlugin(),
        rootRedirectPlugin(),
        serveCorePlugin(),
        viteCommonjs(),
        workerPlugin(),
        wasm(),
        htmlTemplatePlugin({
            assetPrefix,
        }),
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
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
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
        },
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
    server: {
        port: 8000,
        open: true,
        host: true,
    },
});
