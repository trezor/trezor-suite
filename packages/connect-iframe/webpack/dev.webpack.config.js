const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const { merge } = require('webpack-merge');
const { WebpackPluginServe } = require('webpack-plugin-serve');

const prod = require('./prod.webpack.config');

const dev = {
    entry: {
        iframe: [`./src/index.ts`, 'webpack-plugin-serve/client'],
        popup: ['../connect-popup/src/index.ts', 'webpack-plugin-serve/client'],
    },
    output: {
        filename: '[name].js',
        publicPath: '/',
        library: 'TrezorConnect',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
    mode: 'development',
    watch: true,
    devtool: 'eval-source-map',
    plugins: [
        new WebpackPluginServe({
            port: 8088,
            hmr: true,
            https: {
                key: fs.readFileSync(path.join(__dirname, './connect_dev.key')),
                cert: fs.readFileSync(path.join(__dirname, './connect_dev.crt')),
            },
            static: [
                path.join(__dirname, '../build'),
                // todo: won't work without running connect-popup webpack ahead of this
                path.join(__dirname, '../../connect-popup/build'),
            ],
        }),
    ],
};

module.exports = merge([prod, dev]);
