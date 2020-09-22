const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const withCustomBabelConfig = require('next-plugin-custom-babel-config');
const withTranspileModules = require('next-transpile-modules');
const withImages = require('next-images');
const withWorkers = require('@zeit/next-workers');

const WebpackPwaManifest = require('webpack-pwa-manifest');
const NextWorkboxPlugin = require('next-workbox-webpack-plugin');

const GitRevisionPlugin = require('git-revision-webpack-plugin');
const webpack = require('webpack');
const pkg = require('./package.json');

const gitRevisionPlugin = new GitRevisionPlugin();
module.exports = withBundleAnalyzer(
    withCustomBabelConfig(
        withTranspileModules(
            withImages(
                withWorkers({
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
                    assetPrefix: process.env.assetPrefix || '',
                    workerLoaderOptions: {
                        name: 'static/[hash].worker.js',
                        publicPath: '/_next/',
                    },
                    experimental: {
                        productionBrowserSourceMaps: true,
                    },
                    webpack: (config, { dev, buildId }) => {
                        config.plugins = [
                            ...config.plugins,
                            new webpack.DefinePlugin({
                                'process.env.SUITE_TYPE': JSON.stringify('web'),
                                'process.env.VERSION': JSON.stringify(pkg.version),
                                'process.env.assetPrefix': JSON.stringify(process.env.assetPrefix),
                                'process.env.COMMITHASH': JSON.stringify(
                                    gitRevisionPlugin.commithash(),
                                ),
                                'process.env.themeColor': JSON.stringify(pkg.themeColor),
                            }),
                        ];

                        if (!dev) {
                            config.plugins = [
                                ...config.plugins,
                                new NextWorkboxPlugin({
                                    buildId,
                                    clientsClaim: true,
                                    skipWaiting: true,
                                    swURLRoot: '/suite-web/browser-add-to-homescreen/wallet/static/workbox', // TEMP: for dev env
                                    runtimeCaching: [
                                        {
                                            urlPattern: '/(news|connect).trezor.io/',
                                            handler: 'staleWhileRevalidate',
                                        },
                                        {
                                            urlPattern: /.*\.(?:png|jpg|jpeg|svg|gif)/,
                                            handler: 'cacheFirst',
                                            options: {
                                                cacheName: 'image-cache',
                                                cacheableResponse: {
                                                    statuses: [0, 200],
                                                },
                                            },
                                        },
                                    ],
                                }),
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
                                    start_url: '/suite-web/browser-add-to-homescreen/wallet/', // TEMP: for dev env
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
);
