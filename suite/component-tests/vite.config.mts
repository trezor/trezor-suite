import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

import { noopCoreJsPlugin, sharedAliases } from '@trezor/suite-build/viteShared';

import { GALLERY_PORT } from './galleryServer';

const repoRoot = resolve(__dirname, '../..');

/* eslint-disable-next-line import/no-default-export */
export default defineConfig({
    root: resolve(__dirname, 'gallery'),
    cacheDir: resolve(repoRoot, 'node_modules/.vite-component-tests'),
    plugins: [noopCoreJsPlugin(), react()],
    resolve: { alias: sharedAliases, preserveSymlinks: true },
    define: {
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify('development'),
        'process.env.SUITE_TYPE': JSON.stringify('web'),
        'process.env.VERSION': JSON.stringify('0.0.0-component-tests'),
        'process.env.COMMIT_HASH': JSON.stringify('component-tests'),
        'process.env.ASSET_PREFIX': JSON.stringify(''),
        global: 'globalThis',
        __DEV__: true,
    },
    build: { outDir: resolve(__dirname, 'dist-gallery'), emptyOutDir: true },
    server: { port: GALLERY_PORT, host: true, strictPort: true, fs: { allow: [repoRoot] } },
    preview: { port: GALLERY_PORT, host: true, strictPort: true },
});
