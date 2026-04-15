import type { StorybookConfig } from '@storybook/react-native-web-vite';
import { createRequire } from 'module';
import path from 'path';
import { InlineConfig, mergeConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const require = createRequire(import.meta.url);

const main: StorybookConfig = {
    stories: ['../../**/stories/**/*.stories.?(ts|tsx|js|jsx)'],
    staticDirs: [
        '../../../suite-common/icons/iconFontsMobile',
        '../../../packages/theme/fonts',
        '../web/static/js',
    ],
    framework: {
        name: '@storybook/react-native-web-vite',
        options: {
            pluginReactOptions: {
                babel: {
                    configFile: false,
                    plugins: [
                        ['@babel/plugin-transform-class-static-block'],
                        ['react-native-worklets/plugin'],
                    ],
                },
            },
        },
    },

    viteFinal(config) {
        const myConfig: InlineConfig = {
            resolve: {
                alias: {
                    // fixes Skia for web
                    // see: https://github.com/Shopify/react-native-skia/discussions/2420#discussioncomment-12972538
                    'react-native/Libraries/Image/AssetRegistry': path.resolve(
                        path.dirname('.'),
                        '..',
                        '..',
                        'node_modules',
                        'react-native-web/dist/modules/AssetRegistry',
                    ),
                    '@trezor/address-validator':
                        require.resolve('./mocks/address-validator.mock.ts'),
                    // @formatjs packages export ./polyfill.js but imports use ./polyfill (no extension)
                    // Vite enforces strict exports resolution so we alias to the full paths
                    '@formatjs/intl-getcanonicallocales/polyfill':
                        require.resolve('@formatjs/intl-getcanonicallocales/polyfill.js'),
                    '@formatjs/intl-locale/polyfill':
                        require.resolve('@formatjs/intl-locale/polyfill.js'),
                    '@formatjs/intl-listformat/polyfill':
                        require.resolve('@formatjs/intl-listformat/polyfill.js'),
                },
            },
            // process.version is accessed by readable-stream (bundled inside browserify-sign →
            // crypto-browserify) during dep pre-bundling, before the vite-plugin-node-polyfills
            // process shim is applied. Without this define, process.version is undefined and
            // readable-stream v2 throws "Cannot read properties of undefined (reading 'slice')".
            define: {
                'process.version': '"v18.0.0"',
            },
            plugins: [nodePolyfills()],
        };

        return mergeConfig(config, myConfig);
    },
};

export default main;
