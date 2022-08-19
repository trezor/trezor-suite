import path from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';
import SentryWebpackPlugin from '@sentry/webpack-plugin';

import alias from '../utils/alias';
import {
    assetPrefix,
    project,
    isDev,
    isAnalyzing,
    isCodesignBuild,
    sentryAuthToken,
} from '../utils/env';
import { getRevision } from '../utils/git';
import JWS_PUBLIC_KEY from '../utils/codesign';
import { getPathForProject } from '../utils/path';
// Get Suite App version from the Suite package.json
import { suiteVersion } from '../../suite/package.json';

const gitRevision = getRevision();

/**
 * Assemble release name for Sentry
 * Same definition is in packages/suite-desktop/scripts/build.js
 */
const sentryRelease = `${suiteVersion}.${project}${
    isCodesignBuild ? '.codesign' : ''
}.${gitRevision}`;

const config: webpack.Configuration = {
    mode: 'production',
    devtool: 'source-map',
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
            // Polyfills crypto API for NodeJS libraries in the browser. 'crypto' does not run without 'stream'
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            // Not required
            child_process: false,
            fs: false,
            net: false,
            tls: false,
            os: false,
            path: false,
            https: false,
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
        minimizer: [
            new TerserPlugin({
                exclude: /static\/connect/, // connect is already minimized with specific rules
            }),
        ],
    },
    performance: {
        maxAssetSize: 10 * 1000 * 1000,
        maxEntrypointSize: 1000 * 1000,
    },
    // We are using WASM package - it's much faster (https://github.com/Emurgo/cardano-serialization-lib)
    // This option makes it possible
    // Unfortunately Cardano Serialization Lib triggers webpack warning:
    // "Critical dependency: the request of a dependency is an expression" due to require in generated wasm module
    // https://github.com/Emurgo/cardano-serialization-lib/issues/119
    experiments: {
        asyncWebAssembly: true,
    },
    ignoreWarnings: [
        {
            module: /cardano-serialization-lib-browser/, // see the comment above `experiments`
        },
    ],
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
            'process.env.SUITE_TYPE': JSON.stringify(project),
            'process.env.VERSION': JSON.stringify(suiteVersion),
            'process.env.COMMITHASH': JSON.stringify(gitRevision),
            'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
            'process.env.PUBLIC_KEY': JSON.stringify(JWS_PUBLIC_KEY),
            'process.env.CODESIGN_BUILD': isCodesignBuild,
            'process.env.SENTRY_RELEASE': JSON.stringify(sentryRelease),
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process',
        }),
        ...(isAnalyzing
            ? [
                  new BundleAnalyzerPlugin({
                      openAnalyzer: true,
                      analyzerMode: isDev ? 'server' : 'static',
                  }),
              ]
            : []),
        ...(!isDev && sentryAuthToken
            ? [
                  new SentryWebpackPlugin({
                      authToken: sentryAuthToken,
                      org: 'satoshilabs',
                      project: 'trezor-suite',
                      release: sentryRelease,
                      include: path.join(getPathForProject(project), 'build'),
                      ignore: ['static/connect'], // connect does not contain source maps for now
                      cleanArtifacts: true,
                  }),
              ]
            : []),
    ],
};

export default config;
