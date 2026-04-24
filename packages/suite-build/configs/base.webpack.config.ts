import { sentryWebpackPlugin } from '@sentry/webpack-plugin';
import path, { resolve } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// Get Suite App version from the Suite package.json
import { WebpackSecurityCheckPlugin } from '@trezor/bundler-security';

import { suiteVersion } from '../../suite/package.json';
import {
    assetPrefix,
    isAnalyzing,
    isCodesignBuild,
    isDev,
    isTanstackReactQueryDevTools,
    project,
    sentryAuthToken,
} from '../utils/env';
import { getRevision } from '../utils/git';
import { getPathForProject } from '../utils/path';

// Shared build-time config lives at repo root; CJS require avoids TS rootDir inclusion.
const { reactCompilerBabelOverride } = require('../../../react-compiler.config');

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
            vm: require.resolve('vm-browserify'),
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
            url: false,
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
        // Throw error on missing exports instead of warning
        strictExportPresence: true,
        rules: [
            // TypeScript/JavaScript
            {
                test: /\.(j|t)sx?$/,
                exclude:
                    // do not use suite loaders for workers, hot reload plugin fucks it up
                    /node_modules|workers\/(blockbook|ripple|blockfrost|stellar)\/index|socks-proxy-agent/i,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: !process.env.INSTRUMENT_CODE,
                        presets: [
                            [
                                '@babel/preset-react',
                                {
                                    runtime: 'automatic',
                                },
                            ],
                            '@babel/preset-typescript',
                            [
                                '@babel/preset-env',
                                {
                                    corejs: 3,
                                    configPath: resolve(__dirname, '../browserslist'),
                                    shippedProposals: true,
                                    useBuiltIns: 'usage',
                                },
                            ],
                        ],
                        // React Compiler is scoped via overrides so it doesn't see files it can't handle.
                        overrides: [reactCompilerBabelOverride],
                        plugins: [
                            [
                                'babel-plugin-styled-components',
                                {
                                    displayName: true,
                                    preprocess: true,
                                },
                            ],
                            ...(isDev ? ['react-refresh/babel'] : []),
                            ...(process.env.INSTRUMENT_CODE
                                ? [
                                      [
                                          'istanbul',
                                          {
                                              cwd: resolve(__dirname, '../../../'),
                                              include: [
                                                  'packages/*/src/**/*',
                                                  'suite-common/*/src/**/*',
                                              ],
                                              exclude: [
                                                  '**/*.test.{ts,tsx,js,jsx}',
                                                  '**/*.spec.{ts,tsx,js,jsx}',
                                                  '**/__tests__/**',
                                                  '**/tests/**',
                                                  '**/test/**',
                                                  '**/e2e/**',
                                              ],
                                              extension: ['.js', '.jsx', '.ts', '.tsx'],
                                          },
                                      ],
                                  ]
                                : []),
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
            // Images
            {
                test: /\.(gif|jpe?g|png|svg|webp)$/,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new WebpackSecurityCheckPlugin(),
        new webpack.ProgressPlugin(),
        new webpack.DefinePlugin({
            'process.browser': true,
            'process.env.SUITE_TYPE': JSON.stringify(project),
            'process.env.VERSION': JSON.stringify(suiteVersion),
            'process.env.COMMITHASH': JSON.stringify(gitRevision),
            'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
            'process.env.IS_CODESIGN_BUILD': `"${isCodesignBuild}"`, // to keep it as string "true"/"false" and not boolean
            'process.env.SENTRY_RELEASE': JSON.stringify(sentryRelease),
            'process.env.TANSTACK_REACT_QUERY_DEV_TOOLS': JSON.stringify(
                isTanstackReactQueryDevTools,
            ),
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
                      telemetry: false,
                      org: 'satoshilabs',
                      project: 'trezor-suite',
                      authToken: sentryAuthToken,
                      release: { name: sentryRelease },
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
