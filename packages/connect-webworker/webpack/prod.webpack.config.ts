import webpack from 'webpack';
import path from 'path';
// import TerserPlugin from 'terser-webpack-plugin';

const config: webpack.Configuration = {
    target: 'webworker',
    mode: 'production',
    entry: {
        'trezor-connect-webworker': path.resolve(__dirname, '../src/worker-to-window.ts'),
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

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-typescript'],
                    },
                },
            },
        ],
    },
    resolve: {
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.ts', '.js'],
        fallback: {
            // Polyfills crypto API for NodeJS libraries in the browser. 'crypto' does not run without 'stream'
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            buffer: 'buffer/',

            // Not required
            child_process: false,
            fs: false,
            net: false,
            tls: false,
            os: false,
            path: false,
            https: false,
            process: 'process/browser',
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    optimization: {
        minimize: false,
    },
};

export default config;
