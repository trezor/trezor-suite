import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineConfig } from 'vitest/config';

const isWeb = process.env.TEST_ENV === 'web';

export default defineConfig({
    test: {
        globals: true,
        ...(isWeb
            ? {
                  browser: {
                      enabled: true,
                      provider: playwright(),
                      instances: [{ browser: 'chromium' }],
                      headless: true,
                      screenshotFailures: false,
                  },
              }
            : {
                  environment: 'node',
              }),
        setupFiles: ['./vitest.setup.ts'],
        globalSetup: './vitest.globalSetup.ts',
        testTimeout: 30000,
        hookTimeout: 40000,
        bail: 1,
        include: process.env.TESTS_PATTERN
            ? process.env.TESTS_PATTERN.split(' ').map(p => `./tests/**/${p.trim()}*.test.ts`)
            : ['./tests/**/*.test.ts'],
        exclude: ['**/libDev/**', '**/lib/**', '**/src/**'],
        sequence: {
            concurrent: false,
            shuffle: process.env.TESTS_RANDOM === 'true',
        },
        fileParallelism: false,
        server: {
            deps: {
                fallbackCJS: true,
            },
        },
    },
    resolve: {
        alias: isWeb
            ? {
                  // Replace TrezorConnect module for web tests
                  '../src': resolve(__dirname, './shims/connect-web.ts'),
                  '../../../src': resolve(__dirname, './shims/connect-web.ts'),
                  // somehow crypto-browserify is not working, using custom shim
                  crypto: resolve(__dirname, './shims/crypto.ts'),
              }
            : {},
    },
    define: {
        global: 'globalThis',
        // Environment variables for tests
        'process.env.TESTS_USE_TX_CACHE': JSON.stringify(process.env.TESTS_USE_TX_CACHE),
        'process.env.TESTS_USE_WS_CACHE': JSON.stringify(process.env.TESTS_USE_WS_CACHE),
        /*
        'process.env.TREZOR_CONNECT_SRC': isWeb
            ? JSON.stringify('http://localhost:8099/base/connect-iframe/build/')
            : 'undefined',
        'process.env.TESTS_FIRMWARE': JSON.stringify(process.env.TESTS_FIRMWARE),
        'process.env.TESTS_INCLUDED_METHODS': JSON.stringify(process.env.TESTS_INCLUDED_METHODS),
        'process.env.TESTS_EXCLUDED_METHODS': JSON.stringify(process.env.TESTS_EXCLUDED_METHODS),
        'process.env.TESTS_TRANSPORT': JSON.stringify(process.env.TESTS_TRANSPORT),*/
    },
    plugins: (isWeb
        ? [
              viteCommonjs(),
              nodePolyfills({
                  exclude: ['crypto', 'fs', 'path'],
                  globals: {
                      Buffer: true,
                      global: false,
                      process: false,
                  },
              }),
          ]
        : []) as any,
});
