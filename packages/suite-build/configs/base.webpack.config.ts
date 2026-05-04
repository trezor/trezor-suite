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
            crypto: require.resolve('crypto-browserify'), // required by multiple dependencies
            stream: require.resolve('stream-browserify'), // required by utxo-lib and keccak
            vm: require.resolve('vm-browserify'), // ignore "vm" imports in "asn1.js@4.10.1" > crypto-browserify"
            util: require.resolve('util'), // required by "xrpl.js"
            assert: require.resolve('assert'), // required by multiple dependencies
            events: require.resolve('events'),
            // Not required
            child_process: false,
            fs: false, // ignore "fs" import in fastxpub (hd-wallet)
            net: false,
            tls: false,
            os: false, // usb
            path: false, // usb
            https: false,
            http: false,
            zlib: false,
            url: false,
        },
        mainFields: ['browser', 'module', 'main'],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            name(_: any, chunks: any) {
                if (chunks.length > 1 && chunks.every((item: any) => item.name)) {
                    return `shared/${chunks.map((item: any) => item.name.split('/').pop()).join('~')}`;
                }
            },
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
                parallel: true,
                extractComments: false,
            }),
        ],
        emitOnErrors: true,
        moduleIds: 'named',
        usedExports: true,
    },
    performance: {
        hints: false,
        maxAssetSize: 10 * 1000 * 1000,
        maxEntrypointSize: 1000 * 1000,
    },
    module: {
        // Throw error on missing exports instead of warning
        strictExportPresence: true,
        rules: [
            // Allow extensionless imports from ESM packages in node_modules (webpack 5 strict ESM)
            {
                test: /\.m?js$/,
                include: /node_modules/,
                resolve: {
                    fullySpecified: false,
                },
            },
            // TypeScript/JavaScript
            {
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/i,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: !process.env.INSTRUMENT_CODE,
                        presets: [
                            ['@babel/preset-react', { runtime: 'automatic' }],
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
                use: [{ loader: 'raw-loader' }],
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
    // We are using WASM package - it's much faster (https://github.com/Emurgo/cardano-serialization-lib)
    // This option makes it possible
    experiments: { asyncWebAssembly: true },
    ignoreWarnings: [
        // Unfortunately Cardano Serialization Lib triggers webpack warning:
        // "Critical dependency: the request of a dependency is an expression" due to require in generated wasm module
        // https://github.com/Emurgo/cardano-serialization-lib/issues/119
        { module: /cardano-serialization-lib-browser/ },
        // checkAuthenticityProof (see comment on how subtle is used there), should be safe to suppress this message
        warning =>
            warning.message.includes(
                "export 'subtle' (imported as 'crypto') was not found in 'crypto' ",
            ),
    ],
};

export default config;
