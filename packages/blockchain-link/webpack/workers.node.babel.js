import { SRC, BUILD } from './constants';

// import webpack from 'webpack';
// import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

module.exports = {
    mode: 'production',
    target: 'node',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}node/`,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: { configFile: 'tsconfig.workers.json' },
                    },
                ],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        mainFields: ['main', 'module'], // prevent wrapping default exports by harmony export (bignumber.js in ripple issue)
        alias: {},
    },
    performance: {
        hints: false,
    },
    // ignore those modules, otherwise webpack throws warning about missing (ws dependency)
    externals: ['utf-8-validate', 'bufferutil'],

    // optimization: {
    //     minimize: false,
    // },

    // ignoring Node.js import in fastxpub (hd-wallet)
    // node: {
    //     fs: 'empty',
    //     net: 'empty',
    //     tls: 'empty',
    //     path: 'empty',
    // },
};
