import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { execSync } from 'child_process';

const commitHash = execSync('git rev-parse HEAD').toString().trim();

const DIST = path.resolve(__dirname, '../build-webextension');
const CONNECT_WEB_PATH = path.join(__dirname, '..', '..', 'connect-web');

const CONNECT_WEB_EXTENSION_PATH = path.join(CONNECT_WEB_PATH, 'src', 'webextension');

const CONNECT_WEB_EXTENSION_PACKAGE_PATH = path.join(
    __dirname,
    '..',
    '..',
    'connect-webextension',
    'build',
);

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        extensionPopup: path.join(
            __dirname,
            '..',
            'src-webextension',
            'pages',
            'extension-popup',
            'index.tsx',
        ),
        connectExplorer: path.join(
            __dirname,
            '..',
            'src-webextension',
            'pages',
            'connect-explorer',
            'index.tsx',
        ),
        serviceWorker: path.join(
            __dirname,
            '..',
            'src-webextension',
            'background',
            'serviceWorker.ts',
        ),
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
        fallback: {
            fs: false, // ignore "fs" import in markdown-it-imsize
            path: false, // ignore "path" import in markdown-it-imsize
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['extensionPopup'],
            filename: 'extension-popup.html',
            template: path.join(
                __dirname,
                '..',
                'src-webextension',
                'pages',
                'extension-popup',
                'index.html',
            ),
            inject: true,
            minify: false,
        }),
        new HtmlWebpackPlugin({
            chunks: ['connectExplorer'],
            filename: 'connect-explorer.html',
            template: path.join(
                __dirname,
                '..',
                'src-webextension',
                'pages',
                'connect-explorer',
                'index.html',
            ),
            inject: true,
            minify: false,
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '..', 'src-webextension', 'manifest.json'),
                    to: `${DIST}/`,
                },
                {
                    from: path.join(__dirname, '..', 'src', 'fonts'),
                    to: `${DIST}/fonts/`,
                },
                {
                    from: path.join(
                        CONNECT_WEB_EXTENSION_PACKAGE_PATH,
                        'trezor-connect-webextension.js',
                    ),
                    to: `${DIST}/vendor`,
                    info: { minimized: false },
                },
                {
                    from: path.join(CONNECT_WEB_EXTENSION_PATH, 'trezor-usb-permissions.js'),
                    to: `${DIST}/vendor`,
                },
                {
                    from: path.join(CONNECT_WEB_EXTENSION_PATH, 'trezor-usb-permissions.html'),
                    to: `${DIST}`,
                },
                {
                    from: path.resolve(__dirname, '../../../docs/packages/connect'),
                    to: path.resolve(DIST, 'docs'),
                },
            ],
        }),
        new webpack.DefinePlugin({
            'process.env.__TREZOR_CONNECT_SRC': JSON.stringify(process.env.__TREZOR_CONNECT_SRC),
            'process.env.COMMIT_HASH': JSON.stringify(commitHash),
        }),
        // Imports from @trezor-connect-web in @trezor/connect-explorer package need to be replaced by imports from @trezor/connect-webextension/lib/prox
        // in order to work properly with @trezor/connect-webextension service worker.
        new webpack.NormalModuleReplacementPlugin(
            /@trezor\/connect-web/,
            '@trezor/connect-webextension/lib/proxy',
        ),
    ],
};

export default config;
