import { defineConfig } from 'tsup';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    name: '@trezor/connect-explorer-theme',
    entry: ['src/index.tsx'],
    format: 'esm',
    dts: true,
    external: ['nextra'],
    outExtension: () => ({ js: '.js' }),
});
