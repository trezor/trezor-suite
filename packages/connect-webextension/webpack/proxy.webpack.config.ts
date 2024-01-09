import webpack from 'webpack';
import path from 'path';

import prod from './prod.webpack.config';

// Generate inline script hosted on https://connect.trezor.io/X/trezor-connect-webextension.js
// This is compiled and polyfilled npm package without Core logic

const BACKGROUND_PROXY_API_PATH = path.resolve(__dirname, '../src/proxy/background-proxy-api.ts');

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        // TODO: add minimize version of it?
        'trezor-connect-webextension-background-proxy': BACKGROUND_PROXY_API_PATH,
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../build'),
    },

    module: prod.module,
    resolve: prod.resolve,
    performance: prod.performance,
    optimization: prod.optimization,
};

// eslint-disable-next-line import/no-default-export
export default config;
