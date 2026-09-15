/* eslint-disable import/no-extraneous-dependencies -- build-time tooling belongs in devDependencies */
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';
import { version as coreJsVersion } from 'core-js/package.json';
import TerserPlugin from 'minimizer-webpack-plugin';
import path, { resolve } from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// Get Suite App version from the Suite package.json
import { WebpackSecurityCheckPlugin } from '@trezor/bundler-security';

import { suiteVersion } from '../package.json';
import {
    isAnalyzing,
    isCodesignBuild,
    isDev,
    isTanstackReactQueryDevTools,
    sentryAuthToken,
    transportBrowserPing,
} from './env';
import { getRevision } from './git';
import {
    REACT_COMPILER_PATHS,
    getUnmatchedReactCompilerPaths,
    reactCompilerOptions,
    shouldCompileWithReactCompiler,
} from './reactCompiler';

// Prevent "webpack: TypeError: Do not know how to serialize a BigInt"
// @ts-expect-error
BigInt.prototype.toJSON = function toJSON() {
    return this.toString();
};

const gitRevision = getRevision();

/**
 * babel-loader's default cache identifier is `core<@babel/core version>,loader<babel-loader
 * version>`, and supplying the option replaces that default instead of extending it — hence the
 * restatement here. Everything else about the babel config is already covered by the per-file cache
 * key, which hashes the resolved options (`loadPartialConfig` flattens `overrides` into them, so
 * toggling the React Compiler on or off invalidates the affected files on its own). What that key
 * never sees is a plugin's version, so an in-place bump of the compiler would otherwise be served
 * from a stale cache.
 */
const babelCacheIdentifier = [
    // eslint-disable-next-line import/no-extraneous-dependencies
    `core${require('@babel/core/package.json').version}`,
    `loader${require('babel-loader/package.json').version}`,
    // eslint-disable-next-line import/no-extraneous-dependencies
    `react-compiler${require('babel-plugin-react-compiler/package.json').version}`,
].join(',');

/**
 * A filter that silently matches nothing is this rollout's primary failure mode: the build stays
 * green and simply ships uncompiled code. `reactCompiler.ts` rejects unmatchable entries at config
 * load; this catches the remaining case — an entry that is a real directory no module in the graph
 * happens to live under. Only webpack can check this — a Vite dev server transforms lazily and
 * never walks a complete graph.
 */
const reactCompilerCoveragePlugin: webpack.WebpackPluginInstance = {
    apply(compiler) {
        compiler.hooks.afterCompile.tap('ReactCompilerCoverage', compilation => {
            // `createChildCompiler` copies this tap onto the child, and a child compilation
            // (html-webpack-plugin's, for one) finishes long before the real module graph is
            // walked. Only the top-level compilation has seen every file.
            if (compilation.compiler.isChild()) return;

            if (REACT_COMPILER_PATHS.length === 0 || compilation.errors.length > 0) return;

            const unmatchedPaths = getUnmatchedReactCompilerPaths();
            if (unmatchedPaths.length === 0) return;

            compilation.errors.push(
                new webpack.WebpackError(
                    `React Compiler: no compiled module matched ${unmatchedPaths.join(', ')}. ` +
                        `Either remove the entry from REACT_COMPILER_PATHS or fix it — as it stands ` +
                        `the build ships that code uncompiled without any other signal.`,
                ),
            );
        });
    },
};

export type BaseConfigOptions = {
    /** Identifies the application in `process.env.SUITE_TYPE` and in the Sentry release name. */
    suiteType: 'web' | 'desktop';
    /** Application directory owning the `build` output, used to locate source maps. */
    baseDir: string;
    /**
     * Prefix every emitted asset URL is resolved against. The desktop renderer loads from
     * `file://` inside the packaged app, so it must be relative.
     */
    assetPrefix: string;
    /**
     * Absolute path to the app's own browserslist file, applied to Webpack's `target` and Babel's `@babel/preset-env`.
     */
    browserslistConfigPath: string;
};

export const createBaseConfig = ({
    suiteType,
    baseDir,
    assetPrefix,
    browserslistConfigPath,
}: BaseConfigOptions): webpack.Configuration => {
    /**
     * Assemble release name for Sentry
     * Same definition is in suite/desktop-app-main/webpack/core.webpack.config.ts
     */
    const sentryRelease = `${suiteVersion}.${suiteType}${
        isCodesignBuild ? '.codesign' : ''
    }.${gitRevision}`;

    return {
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
                // recharts deep-imports 29 lodash functions from the CJS build, which cannot be
                // tree-shaken or scope-hoisted. lodash-es is the same 4.18.1 code as ESM with
                // `sideEffects: false`, so the same imports shrink by ~30%. Prefix alias: `lodash/get`
                // becomes `lodash-es/get`, and `lodash-es/*` is left alone.
                lodash: 'lodash-es',
                // lottie-web's entry point is the full player: svg + canvas + html renderers and the
                // expressions engine. We only ever use the svg renderer, and none of our animations use
                // expressions or effects, so the light player renders them identically for ~28 kB gzip
                // less. Adding an animation that needs either would silently break here.
                'lottie-web$': require.resolve('lottie-web/build/player/lottie_light'),
                // mainFields prefers "browser", which points lottie-react at its UMD bundle and blocks
                // tree shaking; go straight to the ESM build instead.
                'lottie-react$': require.resolve('lottie-react/build/index.es.js'),
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
                dgram: false, // TODO: remove once UdpTransport is wired via dependency injection (follow-up PR) and the static import from TransportList is gone
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
            // Prefer the ESM 'module' entry over 'browser', which in several packages points at a
            // UMD or pre-bundled file that cannot be tree-shaken (e.g. lottie-react, dropbox).
            mainFields: ['module', 'browser', 'main'],
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
            moduleIds: 'deterministic',
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
                            cacheIdentifier: babelCacheIdentifier,
                            presets: [
                                ['@babel/preset-react', { runtime: 'automatic' }],
                                '@babel/preset-typescript',
                                [
                                    '@babel/preset-env',
                                    {
                                        /*
                                         The coreJS version needs to be specified exactly. If we specified just `3`,
                                         it would be parsed as 3.0.0, so all the polyfills that coreJS provides between
                                         3.0.0 and current version would be unavailable to babel → polyfills would not be applied.
                                        */
                                        corejs: coreJsVersion,
                                        /*
                                         WARNING: node_modules are excluded from babel loader, so the browserslist
                                         specified here is not applied to node_modules. The code is not transpiled to
                                         the compatible syntax. There is a danger if we install a dependency with newer
                                         syntax, that it will break (mainly for old Web browsers, while Desktop uses a
                                         predictable, fairly new Chromium version).
                                         This only pertains syntax. Fortunately, all unsupported globals and methods are
                                         polyfilled by the coreJS static import, see useBuiltIns setting.
                                         TODO: apply also on node_modules, then we can delete the static coreJS import in MainWeb.tsx
                                        */
                                        configPath: browserslistConfigPath,
                                        shippedProposals: true,
                                        /*
                                         `entry` rewrites the global `import 'core-js/actual'`, imported in
                                         suite/web-app & suite/desktop-app-renderer, to only those polyfills that the
                                         browserslist targets lack, instead of shipping all the ~440 core-js features.
                                        */
                                        useBuiltIns: 'entry',
                                    },
                                ],
                            ],
                            overrides: [
                                {
                                    include: shouldCompileWithReactCompiler,
                                    plugins: [
                                        ['babel-plugin-react-compiler', reactCompilerOptions],
                                    ],
                                },
                                {
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
            reactCompilerCoveragePlugin,
            new webpack.ProgressPlugin(),
            new webpack.DefinePlugin({
                'process.browser': true,
                'process.env.SUITE_TYPE': JSON.stringify(suiteType),
                'process.env.VERSION': JSON.stringify(suiteVersion),
                'process.env.COMMITHASH': JSON.stringify(gitRevision),
                'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
                'process.env.IS_CODESIGN_BUILD': `"${isCodesignBuild}"`, // to keep it as string "true"/"false" and not boolean
                'process.env.SENTRY_RELEASE': JSON.stringify(sentryRelease),
                'process.env.TANSTACK_REACT_QUERY_DEV_TOOLS': JSON.stringify(
                    isTanstackReactQueryDevTools,
                ),
                'process.env.TRANSPORT_BROWSER_PING': JSON.stringify(transportBrowserPing),
                __SENTRY_DEBUG__: isDev,
                // Keeps Sentry tracing/performance code in the bundle. Must stay truthy for
                // browserTracingIntegration (transactions, Web Vitals) and trace-lifecycle profiling
                // to work; setting it false tree-shakes all of that out at build time.
                __SENTRY_TRACING__: true,
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
                              assets: path.join(baseDir, 'build', '**'),
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
};
