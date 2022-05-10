import path from 'path';
import fs from 'fs';
import { merge } from 'webpack-merge';
import { WebpackPluginServe } from 'webpack-plugin-serve';

// todo: https://github.com/trezor/trezor-suite/issues/5305
import popup from '../../connect-popup/webpack/prod.webpack.config';
// todo: https://github.com/trezor/trezor-suite/issues/5305
import iframe from '../../connect-iframe/webpack/prod.webpack.config';
import prod from './prod.webpack.config';

const dev = {
    mode: 'development',
    watch: true,
    devtool: 'eval-source-map',
    entry: {
        'trezor-connect': path.resolve(__dirname, '../src/index.ts'),
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../build'),
        publicPath: './',
        library: 'TrezorConnect',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
    plugins: [
        // connect-web dev needs to be served from https
        // to allow injection in 3rd party builds using trezor-connect-src param
        new WebpackPluginServe({
            port: 8088,
            hmr: true,
            https: {
                key: fs.readFileSync(path.join(__dirname, '../webpack/connect_dev.key')),
                cert: fs.readFileSync(path.join(__dirname, '../webpack/connect_dev.crt')),
            },
            static: [
                path.join(__dirname, '../build'),
                path.join(__dirname, '../../connect-popup/build'),
                path.join(__dirname, '../../connect-iframe/build'),
            ],
        }),
    ],
};

export default merge([iframe, popup, prod, dev]);
