/* eslint-disable import/no-default-export */
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const DIST = path.resolve(__dirname, '../build');
const CONNECT_WEB_PATH = path.join(__dirname, '..', '..', 'connect-web');

const CONNECT_WEB_EXTENSION_PATH = path.join(CONNECT_WEB_PATH, 'src', 'webextension');

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        extensionPopup: path.join(__dirname, '..', 'src', 'pages', 'extension-popup', 'index.tsx'),
        connectExplorer: path.join(
            __dirname,
            '..',
            'src',
            'pages',
            'connect-explorer',
            'index.tsx',
        ),
        serviceWorker: path.join(__dirname, '..', 'src', 'background', 'serviceWorker.ts'),
    },
    output: {
        filename: '[name].bundle.js',
        path: DIST,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: [
                            [
                                '@babel/preset-react',
                                {
                                    runtime: 'automatic',
                                },
                            ],
                            '@babel/preset-typescript',
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            [
                                'babel-plugin-styled-components',
                                {
                                    displayName: true,
                                    preprocess: true,
                                },
                            ],
                        ],
                    },
                },
            },
            {
                test: /\.(gif|jpe?g|png|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: './images/[name][contenthash][ext]',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],
    },
    performance: {
        hints: false,
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['extensionPopup'],
            filename: 'extension-popup.html',
            template: path.join(__dirname, '..', 'src', 'pages', 'extension-popup', 'index.html'),
            inject: true,
            minify: false,
        }),
        new HtmlWebpackPlugin({
            chunks: ['connectExplorer'],
            filename: 'connect-explorer.html',
            template: path.join(__dirname, '..', 'src', 'pages', 'connect-explorer', 'index.html'),
            inject: true,
            minify: false,
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '..', 'src', 'manifest.json'),
                    to: `${DIST}/`,
                },
            ],
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '..', 'assets'),
                    to: `${DIST}/assets`,
                },
            ],
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(CONNECT_WEB_EXTENSION_PATH, 'trezor-content-script.js'),
                    to: `${DIST}/vendor`,
                },
                {
                    from: path.join(CONNECT_WEB_EXTENSION_PATH, 'trezor-usb-permissions.js'),
                    to: `${DIST}/vendor`,
                },
                {
                    from: path.join(CONNECT_WEB_EXTENSION_PATH, 'trezor-usb-permissions.html'),
                    to: `${DIST}`,
                },
            ],
        }),
        new webpack.DefinePlugin({
            // eslint-disable-next-line no-underscore-dangle
            'process.env.__TREZOR_CONNECT_SRC': JSON.stringify(process.env.__TREZOR_CONNECT_SRC),
        }),
    ],
};

export default config;
