const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const withCustomBabelConfig = require('next-plugin-custom-babel-config');
const withTranspileModules = require('next-transpile-modules');
const withImages = require('next-images');
const withWorkers = require('@zeit/next-workers');
const withOffline = require('next-offline');
const WebpackPwaManifest = require('webpack-pwa-manifest');

const GitRevisionPlugin = require('git-revision-webpack-plugin');
const webpack = require('webpack');
const pkg = require('./package.json');

const gitRevisionPlugin = new GitRevisionPlugin();
const assetPrefix = process.env.assetPrefix || '';

module.exports = withBundleAnalyzer(
    withCustomBabelConfig(
        withTranspileModules(
            withImages(
                withWorkers(
                    withOffline({
                        assetPrefix,
                        typescript: {
                            ignoreDevErrors: true,
                        },
                        inlineImageLimit: 0,
                        babelConfigFile: path.resolve('babel.config.js'),
                        // https://github.com/zeit/next.js/issues/6219
                        // target: 'serverless',
                        transpileModules: [
                            '@trezor',
                            '../packages/suite/src', // issue: https://github.com/zeit/next.js/issues/5666
                        ],
                        trailingSlash: true,
                        workerLoaderOptions: {
                            name: 'static/[hash].worker.js',
                            publicPath: '/_next/',
                        },
                        experimental: {
                            productionBrowserSourceMaps: true,
                        },
                        dontAutoRegisterSw: true,
                        workboxOpts: {
                            runtimeCaching: [
                                {
                                    urlPattern: '/(news|connect).trezor.io/',
                                    handler: 'NetworkFirst',
                                    options: {
                                        cacheName: 'api-cache',
                                    },
                                },
                                {
                                    urlPattern: /.*\.(?:png|jpg|jpeg|svg|gif)/,
                                    handler: 'CacheFirst',
                                    options: {
                                        cacheName: 'image-cache',
                                        cacheableResponse: {
                                            statuses: [0, 200],
                                        },
                                    },
                                },
                            ],
                        },
                        webpack: (config, { dev }) => {
                            config.plugins = [
                                ...config.plugins,
                                new webpack.DefinePlugin({
                                    'process.env.SUITE_TYPE': JSON.stringify('web'),
                                    'process.env.VERSION': JSON.stringify(pkg.version),
                                    'process.env.assetPrefix': JSON.stringify(assetPrefix),
                                    'process.env.COMMITHASH': JSON.stringify(
                                        gitRevisionPlugin.commithash(),
                                    ),
                                    'process.env.themeColor': JSON.stringify(pkg.themeColor),
                                }),
                            ];

                            if (!dev) {
                                config.plugins = [
                                    ...config.plugins,
                                    new WebpackPwaManifest({
                                        filename: '../static/manifest.json',
                                        name: pkg.longName,
                                        short_name: pkg.shortName,
                                        description: pkg.description,
                                        theme_color: pkg.themeColor,
                                        background_color: '#e3e3e3',
                                        orientation: 'portrait',
                                        display: 'standalone',
                                        fingerprints: false,
                                        inject: false,
                                        start_url: `${assetPrefix}`,
                                        ios: {
                                            'apple-mobile-web-app-title': pkg.longName,
                                            'apple-mobile-web-app-status-bar-style': pkg.themeColor,
                                        },
                                        icons: [
                                            {
                                                src: path.join(
                                                    __dirname,
                                                    '..',
                                                    'suite-data',
                                                    'files',
                                                    'images',
                                                    'icons',
                                                    '512x512.png',
                                                ),
                                                sizes: [96, 128, 192, 256, 384, 512],
                                                destination: '../static/images/icons',
                                            },
                                        ],
                                    }),
                                ];
                            }

                            return config;
                        },
                    }),
                ),
            ),
        ),
    ),
);
