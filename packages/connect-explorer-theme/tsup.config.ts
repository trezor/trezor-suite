import { defineConfig } from 'tsup';

export default defineConfig({
    name: '@trezor/connect-explorer-theme',
    entry: ['src/index.tsx'],
    format: 'esm',
    dts: true,
    external: ['nextra'],
    outExtension: () => ({ js: '.js' }),
});
