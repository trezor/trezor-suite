import CopyWebpackPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import { routes } from '@suite/router-config';
import { FLAGS } from '@suite-common/suite-config';

import { assetPrefix, isDev } from '../utils/env';
import { getPathForProject } from '../utils/path';

export const baseDir = getPathForProject('web');

const config: webpack.Configuration = {
    target: 'browserslist',
    entry: {
        main: [path.join(baseDir, 'src', 'index.ts')],
        'sessions-background-sharedworker': {
            filename: 'workers/[name].js',
            import: path.resolve(
                __dirname,
                '../../transport/src/sessions/background-sharedworker.ts',
            ),
            // Use importScripts-based chunk loading so vendor/runtime chunks load in a worker context
            chunkLoading: 'import-scripts',
        },
        'connect-popup-bootstrap': {
            filename: 'connect-popup/bootstrap.[hash].js',
            import: path.resolve(__dirname, '../../connect-web/src/bootstrap/bootstrap.ts'),
        },
    },
    output: {
        path: path.join(baseDir, 'build'),
    },
    resolve: {
        fallback: { vm: require.resolve('vm-browserify') },
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                'browser-detection',
                'fonts',
                'images',
                'oauth',
                'videos',
                'guide/assets',
                'favicon.js',
            ]
                .map(dir => ({
                    from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                    to: path.join(baseDir, 'build', 'static', dir),
                }))
                // .concat([
                //     {
                //         from: path.join(__dirname, '../../connect-web/src/iframe'),
                //         to: path.join(baseDir, 'build/connect-popup'),
                //     },
                // ])
                .concat([
                    {
                        from: path.join(
                            __dirname,
                            '../../../',
                            'suite-common',
                            'message-system',
                            'files',
                            'config.v1.ts',
                        ),
                        to: path.join(baseDir, 'build', 'static', 'message-system'),
                    },
                ]),
            options: {
                concurrency: 100,
            },
        }),
        // Html files
        ...routes.map(
            route =>
                new HtmlWebpackPlugin({
                    chunks: ['main'],
                    minify: isDev
                        ? false
                        : {
                              collapseWhitespace: true,
                              keepClosingSlash: true,
                              removeComments: true,
                              removeRedundantAttributes: true,
                              removeScriptTypeAttributes: true,
                              removeStyleLinkTypeAttributes: true,
                              useShortDoctype: true,
                              minifyJS: true,
                          },
                    templateParameters: {
                        assetPrefix,
                        isOnionLocation: FLAGS.ONION_LOCATION_META,
                    },
                    inject: 'body' as const,
                    scriptLoading: 'blocking' as const,
                    template: path.join(baseDir, 'src', 'static', 'index.html'),
                    filename: path.join(baseDir, 'build', route.pattern, 'index.html'),
                }),
        ),
        new HtmlWebpackPlugin({
            chunks: ['connect-popup-bootstrap'],
            minify: false,
            templateParameters: {
                assetPrefix,
                isOnionLocation: FLAGS.ONION_LOCATION_META,
            },
            inject: 'body' as const,
            scriptLoading: 'blocking' as const,
            template: path.resolve(__dirname, '../../connect-web/src/bootstrap/bootstrap.html'),
            filename: path.join(baseDir, 'build/connect-popup/iframe.html'),
        }),
        ...(!isDev ? [new CssMinimizerPlugin()] : []),
    ],
};

export default config;
