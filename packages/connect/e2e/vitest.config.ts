/// <reference types="@vitest/browser/providers/playwright" />
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from 'vite-plugin-wasm';
import { type Plugin, defineConfig } from 'vitest/config';

const isWebProject = process.env.VITEST_PROJECT === 'browser';
const nodeRequire = createRequire(import.meta.url);

/**
 * Vite plugin that provides the TX_CACHE data as a virtual module.
 * In Node environment, __txcache__/index.js uses fs.readdirSync which works fine.
 * In browser environment, we need to pre-read all JSON cache files at build time
 * and serve them as a virtual module.
 */
function txCachePlugin(): Plugin {
    const virtualModuleId = 'virtual:txcache';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    const cacheFiles = (dir: string, cache: Record<string, unknown> = {}) => {
        const dirFiles = fs.readdirSync(dir);
        dirFiles.forEach(file => {
            const filePath = path.resolve(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                cacheFiles(filePath, cache);
            } else if (file.endsWith('.json')) {
                const key = file.substring(0, 6);
                if (key in cache) throw Error(`TX_CACHE duplicated key: ${key} file: ${file}`);
                const rawJson = fs.readFileSync(filePath, 'utf-8');
                const content = JSON.parse(rawJson);
                cache[key] = {
                    ...content,
                    hash: file.split('.')[0],
                };
            }
        });

        return cache;
    };

    return {
        name: 'tx-cache',
        resolveId(id: string) {
            if (id === virtualModuleId) return resolvedVirtualModuleId;
        },
        load(id: string) {
            if (id === resolvedVirtualModuleId) {
                const cacheDir = path.resolve(__dirname, './__txcache__');
                const cache = cacheFiles(cacheDir);

                return `export const CACHE = ${JSON.stringify(cache)};`;
            }
        },
    };
}

/**
 * Vite plugin that transforms coins.json to redirect blockchain_link URLs
 * to the local WS cache server when TESTS_USE_WS_CACHE is enabled.
 */
function wsCacheTransformPlugin(): Plugin {
    return {
        name: 'ws-cache-transform',
        transform(code: string, id: string) {
            if (process.env.TESTS_USE_WS_CACHE !== 'true' || !id.includes('coins.json')) {
                return;
            }

            try {
                const json = JSON.parse(code.replace(/^export default /, '').replace(/;$/, ''));
                Object.keys(json).forEach(key => {
                    json[key].forEach(
                        (coin: {
                            blockchain_link?: { type: string; url: string[] };
                            shortcut: string;
                        }) => {
                            if (coin.blockchain_link) {
                                if (coin.blockchain_link.type === 'solana') return;
                                const query = `?type=${coin.blockchain_link.type}&shortcut=${coin.shortcut}&suffix=/websocket`;
                                coin.blockchain_link.url = [`ws://localhost:18088/${query}`];
                            }
                        },
                    );
                });

                return `export default ${JSON.stringify(json)};`;
            } catch {
                // not a JSON module we care about
            }
        },
    };
}

/**
 * Vite plugin that transforms CommonJS require() calls for JSON files into inline JSON.parse().
 * Many workspace packages (connect-data, connect) use require() for JSON imports,
 * which doesn't work in browser ESM mode. Non-JSON require() calls are left
 * unchanged.
 */
function requireToImportPlugin(): Plugin {
    return {
        name: 'require-to-import',
        enforce: 'pre',
        transform(code: string, id: string) {
            if (!code.includes('require(') || id.includes('node_modules')) return;

            const transformed = code.replace(
                /require\(['"]([^'"]+)['"]\)/g,
                (_match: string, importPath: string) => {
                    // Try to resolve as JSON file
                    let absolutePath: string;
                    if (importPath.startsWith('.')) {
                        absolutePath = path.resolve(path.dirname(id), importPath);
                    } else {
                        // Package import like @trezor/connect-data/files/coins.json
                        try {
                            absolutePath = nodeRequire.resolve(importPath, {
                                paths: [path.dirname(id)],
                            });
                        } catch {
                            return _match;
                        }
                    }

                    // If it resolves to a JSON file, inline it
                    if (absolutePath.endsWith('.json')) {
                        try {
                            const jsonContent = fs.readFileSync(absolutePath, 'utf-8');
                            JSON.parse(jsonContent); // validate

                            return `JSON.parse(${JSON.stringify(jsonContent)})`;
                        } catch {
                            return _match;
                        }
                    }

                    return _match;
                },
            );

            if (transformed !== code) {
                return { code: transformed, map: null };
            }
        },
    };
}

export default defineConfig({
    resolve: {
        alias: [
            {
                // Replace getRandomInt with a deterministic mock so output permutation
                // fixtures are stable. This works at the Vite module graph level, affecting
                // all transitive workspace consumers (e.g. @trezor/utxo-lib).
                find: /.*\/getRandomInt$/,
                replacement: path.resolve(__dirname, './__mocks__/getRandomInt.ts'),
            },
            {
                // "usb" package sets event listeners on the top level causing memory leaks.
                // See: https://github.com/trezor/trezor-suite/pull/25952
                find: /^usb$/,
                replacement: nodeRequire.resolve('../../transport/mocks/usb.js'),
            },
        ],
    },
    plugins: [
        txCachePlugin(),
        ...(isWebProject
            ? [
                  wasm(),
                  nodePolyfills({
                      include: ['crypto', 'stream', 'vm', 'buffer', 'process', 'util'],
                      globals: {
                          Buffer: true,
                          process: true,
                      },
                      overrides: {
                          // Use the same polyfill packages that webpack used
                          crypto: 'crypto-browserify',
                          stream: 'stream-browserify',
                          vm: 'vm-browserify',
                      },
                  }),
                  wsCacheTransformPlugin(),
                  requireToImportPlugin(),
              ]
            : []),
    ],
    define: {
        'process.env.TESTS_FIRMWARE': JSON.stringify(process.env.TESTS_FIRMWARE),
        'process.env.TESTS_INCLUDED_METHODS': JSON.stringify(process.env.TESTS_INCLUDED_METHODS),
        'process.env.TESTS_EXCLUDED_METHODS': JSON.stringify(process.env.TESTS_EXCLUDED_METHODS),
        'process.env.TESTS_USE_TX_CACHE': JSON.stringify(process.env.TESTS_USE_TX_CACHE),
        'process.env.TESTS_USE_WS_CACHE': JSON.stringify(process.env.TESTS_USE_WS_CACHE),
        'process.env.TESTS_TRANSPORT': JSON.stringify(process.env.TESTS_TRANSPORT),
        'process.env.EMULATOR_START_OPTS': JSON.stringify(process.env.EMULATOR_START_OPTS),
        ...(isWebProject
            ? {
                  'process.version': JSON.stringify(process.version),
                  'process.browser': 'true',
              }
            : {}),
    },
    optimizeDeps: isWebProject
        ? {
              include: [
                  'vite-plugin-node-polyfills/shims/buffer',
                  'vite-plugin-node-polyfills/shims/global',
                  'vite-plugin-node-polyfills/shims/process',
                  'crypto',
              ],
          }
        : undefined,
    test: {
        root: path.resolve(__dirname, '..'),
        include: process.env.TESTS_PATTERN
            ? process.env.TESTS_PATTERN.split(' ').map(p =>
                  p.endsWith('.test') ? `e2e/tests/**/${p}.ts` : `e2e/tests/**/${p}*.test.ts`,
              )
            : ['e2e/tests/**/*.test.ts'],
        globals: true,
        fileParallelism: false,
        testTimeout: 30000,
        hookTimeout: 40000,
        reporters: ['verbose'],
        sequence: {
            shuffle: false,
        },
        setupFiles: [
            path.resolve(__dirname, './vitest.setup.ts'),
            path.resolve(__dirname, './common.setup.ts'),
        ],
        globalSetup: path.resolve(__dirname, './vitest.globalSetup.ts'),
        ...(isWebProject
            ? {
                  browser: {
                      enabled: true,
                      provider: 'playwright',
                      headless: true,
                      instances: [
                          {
                              browser: 'chromium',
                              launch: {
                                  args: ['--no-sandbox'],
                              },
                          },
                      ],
                  },
              }
            : {
                  environment: 'node',
              }),
    },
});
