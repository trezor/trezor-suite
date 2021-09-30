import { SRC, BUILD } from './constants';

module.exports = {
    target: 'node',
    mode: 'production',

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
                test: /\.ts$/,
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
    },
    performance: {
        hints: false,
    },
};
