import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

if (!process.env.__SUITE_WEB_URL__) {
    console.warn(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ⚠️  __SUITE_WEB_URL__ is not set!                              ║
║                                                                  ║
║   The webextension build will fall back to the production        ║
║   suite.trezor.io URL.                                           ║
║                                                                  ║
║   Set __SUITE_WEB_URL__ env variable to point to a custom        ║
║   suite-web instance.                                            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

const DIST = path.resolve(__dirname, '../build-webextension');

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
        serviceWorker: path.join(
            __dirname,
            '..',
            'src-webextension',
            'background',
            'serviceWorker.ts',
        ),
    },
    experiments: {
        outputModule: true,
    },
    output: {
        filename: '[name].bundle.js',
        path: DIST,
        publicPath: './',
        module: true,
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
                test: /\.(gif|jpe?g|png|svg|webp)$/,
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
        new webpack.DefinePlugin({
            __SUITE_WEB_URL__: JSON.stringify(process.env.__SUITE_WEB_URL__),
        }),
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
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '..', 'src-webextension', 'manifest.json'),
                    to: `${DIST}/`,
                },
            ],
        }),
    ],
    optimization: {
        minimize: false,
        minimizer: [],
    },
};

export default config;
