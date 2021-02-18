import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import WorkboxPlugin from 'workbox-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import routes from '../../suite/src/config/suite/routes';
import { FLAGS } from '../../suite/src/config/suite/features';

import { assetPrefix, isDev } from '../utils/env';
import { getPathForProject } from '../utils/path';

// Configuration for HTML output (html-webpack-plugin)
const htmlConfig = {
    minify: false, // !isDev,
    templateParameters: {
        assetPrefix,
        isOnionLocation: FLAGS.ONION_LOCATION_META,
    },
    inject: 'body' as const,
    scriptLoading: 'blocking' as const,
};

const baseDir = getPathForProject('web');
const config: webpack.Configuration = {
    entry: [path.join(baseDir, 'src', 'index.ts')],
    output: {
        path: path.join(baseDir, 'build'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '..', '..', 'suite-data', 'files'),
                    to: path.join(baseDir, 'build', 'static'),
                },
                {
                    from: path.join(baseDir, 'src', 'static', 'app.webmanifest'),
                    to: path.join(baseDir, 'build', 'app.webmanifest'),
                    transform: (content: any) =>
                        content.toString().replace(/\{assetPrefix\}/g, assetPrefix),
                },
            ],
            options: {
                concurrency: 100,
            },
        }),
        // Html files
        ...routes.map(
            route =>
                new HtmlWebpackPlugin({
                    ...htmlConfig,
                    template: path.join(baseDir, 'src', 'static', 'index.html'),
                    filename: path.join(baseDir, 'build', route.pattern, 'index.html'),
                }),
        ),
        new HtmlWebpackPlugin({
            ...htmlConfig,
            template: path.join(baseDir, 'src', 'static', '404.html'),
            filename: path.join(baseDir, 'build', '404.html'),
        }),
        // PWA
        FLAGS.PWA &&
            new WorkboxPlugin.GenerateSW({
                swDest: 'sw.js',
                clientsClaim: true,
                skipWaiting: true,
                maximumFileSizeToCacheInBytes: 10 * 1000 * 1000,
                runtimeCaching: [
                    {
                        urlPattern: /.*\.js(.map)?$/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'js-cache',
                        },
                    },
                    {
                        urlPattern: '/(news|connect).trezor.io/',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                        },
                    },
                    {
                        urlPattern: /\.(gif|jpe?g|png|svg)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            }),
        isDev && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean), // Filters out disabled plugins
};

export default config;
