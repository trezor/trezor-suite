import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import alias from '../utils/alias';
import { assetPrefix, project, isDev, isAnalyzing, isCodesignBuild } from '../utils/env';
import { getRevision } from '../utils/git';
import JWS_PUBLIC_KEY from '../utils/codesign';

import pkgFile from '../../suite-desktop/package.json';

const gitRevision = getRevision();

const config: webpack.Configuration = {
    mode: 'production',
    target: 'browserslist',
    devtool: false,
    output: {
        publicPath: `${assetPrefix}/`,
        filename: 'js/[name].[contenthash:8].js',
        chunkFilename: 'js/[id].[contenthash:8].js',
        assetModuleFilename: `assets/[hash][ext][query]`,
        pathinfo: false,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: ['node_modules'],
        alias,
        fallback: {
            // Polyfills API for NodeJS libraries in the browser
            buffer: require.resolve('buffer'),
            crypto: require.resolve('crypto-browserify'), // Can maybe be removed after getting rid of Google OAuth Lib
            stream: require.resolve('stream-browserify'),
            // For Google OAuth library to work
            child_process: false,
            fs: false,
            net: false,
            tls: false,
            // Not needed
            os: false,
            process: false,
            path: false,
        },
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                react: {
                    chunks: 'initial',
                    name: 'react',
                    test: /[\\/]node_modules[\\/]react/,
                },
                vendors: {
                    chunks: 'initial',
                    name: 'vendors',
                    test: /[\\/]node_modules[\\/](?!react)/,
                },
                components: {
                    chunks: 'initial',
                    name: 'components',
                    test: /[\\/]packages[\\/]components[\\/]/,
                },
            },
        },
    },
    performance: {
        maxAssetSize: 10 * 1000 * 1000,
        maxEntrypointSize: 1000 * 1000,
    },
    module: {
        rules: [
            // TypeScript/JavaScript
            {
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: ['@babel/preset-react', '@babel/preset-typescript'],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            [
                                'babel-plugin-styled-components',
                                {
                                    displayName: true,
                                    preprocess: true,
                                },
                            ],
                            ...(isDev ? ['react-refresh/babel'] : []),
                        ],
                    },
                },
            },
            {
                test: /\.md/,
                use: [
                    {
                        loader: 'raw-loader',
                    },
                ],
            },
            // Workers
            {
                test: /\/workers\/(.*).ts$/,
                use: [
                    {
                        loader: 'worker-loader',
                        options: {
                            filename: 'static/worker.[contenthash].js',
                        },
                    },
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-typescript'],
                        },
                    },
                ],
            },
            // Images
            {
                test: /\.(gif|jpe?g|png|svg)$/,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new webpack.DefinePlugin({
            'process.browser': true,
            'process.env': JSON.stringify(process.env),
            'process.env.SUITE_TYPE': JSON.stringify(project),
            'process.env.VERSION': JSON.stringify(pkgFile.version),
            'process.env.COMMITHASH': JSON.stringify(gitRevision),
            'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
            'process.env.PUBLIC_KEY': JSON.stringify(JWS_PUBLIC_KEY),
            'process.env.CODESIGN_BUILD': isCodesignBuild,
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process',
        }),
        isAnalyzing &&
            new BundleAnalyzerPlugin({
                openAnalyzer: true,
                analyzerMode: isDev ? 'server' : 'static',
            }),
    ].filter(Boolean),
};

export default config;
