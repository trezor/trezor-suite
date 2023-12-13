import path from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';

import {
    assetPrefix,
    project,
    isDev,
    isAnalyzing,
    isCodesignBuild,
    sentryAuthToken,
    jwsPublicKey,
} from '../utils/env';
import { getRevision } from '../utils/git';
import { getPathForProject } from '../utils/path';
// Get Suite App version from the Suite package.json
import { suiteVersion } from '../../suite/package.json';

const gitRevision = getRevision();

/**
 * Assemble release name for Sentry
 * Same definition is in packages/suite-desktop/scripts/build.ts
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
        alias: {
            src: path.resolve(__dirname, '../../suite/src/'),
        },
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
            http: false,
            zlib: false,
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
                            '@babel/plugin-transform-class-properties',
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
            'process.env.JWS_PUBLIC_KEY': JSON.stringify(jwsPublicKey),
            'process.env.CODESIGN_BUILD': isCodesignBuild,
            'process.env.SENTRY_RELEASE': JSON.stringify(sentryRelease),
            __SENTRY_DEBUG__: isDev,
            __SENTRY_TRACING__: false, // needs to be removed when we introduce performance monitoring in trezor-suite
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
                  sentryWebpackPlugin({
                      org: 'satoshilabs',
                      project: 'trezor-suite',
                      authToken: sentryAuthToken,
                      release: { name: sentryRelease, cleanArtifacts: true },
                      sourcemaps: {
                          assets: path.join(getPathForProject(project), 'build'),
                          ignore: ['static/connect'], // connect does not contain source maps for now
                      },
                  }),
              ]
            : []),
    ],
};

export default config;
