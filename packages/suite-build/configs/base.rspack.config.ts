import path from 'path';
import rspack, { Configuration /*SwcLoaderOptions*/ } from '@rspack/core';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';

import {
    assetPrefix,
    project,
    isDev,
    isAnalyzing,
    isCodesignBuild,
    sentryAuthToken,
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

const config: Configuration = {
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
            new rspack.SwcJsMinimizerRspackPlugin({
                exclude: /static\/connect/, // connect is already minimized with specific rules
            }),
        ],
    },
    performance: {
        maxAssetSize: 10 * 1000 * 1000,
        maxEntrypointSize: 1000 * 1000,
    },
    module: {
        // Throw error on missing exports instead of warning
        parser: {
            javascript: {
                exportsPresence: 'error',
            },
        },
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
            /*
            {
                test: /\.(j|t)sx?$/,
                exclude: [/[\\/]node_modules[\\/]/],
                loader: 'builtin:swc-loader',
                options: {
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                        },
                        externalHelpers: true,
                        transform: {
                            react: {
                                runtime: 'automatic',
                                development: isDev,
                                refresh: isDev,
                            },
                        },
                    },
                    env: {
                        // TODO remove?
                        targets: 'Chrome >= 128',
                        // targets: 'browserslist:Chrome >= 128',
                    },
                } satisfies SwcLoaderOptions,
                // TODO https://www.npmjs.com/package/@swc/plugin-styled-components
            },
            */
            {
                test: /\.md/,
                type: 'asset/source',
            },
            // This worker loader is used for suite-desktop
            // TODO: both Rspack and webpack 5 no longer need worker-loader
            //  https://rspack.org/guide/features/web-workers
            //  https://webpack.js.org/guides/web-workers/
            {
                test: /\/workers\/[^/]+\/index\.ts$/,
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
        new rspack.ProgressPlugin(),
        new rspack.DefinePlugin({
            'process.browser': true,
            'process.env.SUITE_TYPE': JSON.stringify(project),
            'process.env.VERSION': JSON.stringify(suiteVersion),
            'process.env.COMMITHASH': JSON.stringify(gitRevision),
            'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
            'process.env.IS_CODESIGN_BUILD': `"${isCodesignBuild}"`, // to keep it as string "true"/"false" and not boolean
            'process.env.SENTRY_RELEASE': JSON.stringify(sentryRelease),
            __SENTRY_DEBUG__: isDev,
            __SENTRY_TRACING__: false, // needs to be removed when we introduce performance monitoring in trezor-suite
        }),
        new rspack.ProvidePlugin({
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
                  // Sentry plugin is for webpack, but compatible with Rspack https://rspack.dev/guide/compatibility/plugin
                  sentryWebpackPlugin({
                      telemetry: false,
                      org: 'satoshilabs',
                      project: 'trezor-suite',
                      authToken: sentryAuthToken,
                      release: { name: sentryRelease, cleanArtifacts: true },
                      sourcemaps: {
                          assets: path.join(getPathForProject(project), 'build', '**'),
                          ignore: ['static/connect'], // connect does not contain source maps for now
                      },
                  }),
              ]
            : []),
    ],
};

export default config;
