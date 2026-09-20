/* eslint-disable import/no-extraneous-dependencies -- build-time tooling belongs in devDependencies */
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

import { routes } from '@suite/router-config';
import { FLAGS } from '@suite-common/suite-config';
import { browserslistConfigPath, createBaseConfig } from '@trezor/suite/webpack/createBaseConfig';
import { createDevConfig } from '@trezor/suite/webpack/createDevConfig';
import { assetPrefix, isDev } from '@trezor/suite/webpack/env';

const baseDir = __dirname;
const repoRoot = path.join(baseDir, '..', '..');
const appAssets = path.join(baseDir, '..', 'app-assets', 'files');
const buildDir = path.join(baseDir, 'build');

const DEV_PORT = 8000;

const webConfig: webpack.Configuration = {
    target: `browserslist:${browserslistConfigPath}`,
    entry: {
        main: [path.join(baseDir, 'src', 'index.ts')],
        'sessions-background-sharedworker': {
            filename: 'js/workers/[name].js',
            import: path.join(
                repoRoot,
                'packages/transport-web/src/sessions/background-sharedworker.ts',
            ),
            // Use importScripts-based chunk loading so vendor/runtime chunks load in a worker context
            chunkLoading: 'import-scripts',
        },
        'connect-popup-bootstrap': {
            filename: 'connect-popup/bootstrap.[contenthash:8].js',
            import: path.join(repoRoot, 'packages/connect-web/src/bootstrap/index.ts'),
        },
    },
    output: {
        path: buildDir,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                ...[
                    'browser-detection',
                    'fonts',
                    'images',
                    'oauth',
                    'videos',
                    'guide/assets',
                    'favicon.js',
                ].map(dir => ({
                    from: path.join(appAssets, dir),
                    to: path.join(buildDir, 'static', dir),
                })),
                {
                    from: path.join(repoRoot, 'suite-common/message-system/files/config.v1.ts'),
                    to: path.join(buildDir, 'static', 'message-system'),
                },
                {
                    from: path.join(
                        path.dirname(require.resolve('@suite-common/flags/package.json')),
                        'assets',
                        'flags',
                    ),
                    to: path.join(buildDir, 'static', 'flags'),
                },
                {
                    from: path.join(appAssets, 'release-notes.md'),
                    to: buildDir,
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
                    filename: path.join(buildDir, route.pattern, 'index.html'),
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
            template: path.join(repoRoot, 'packages/connect-web/src/bootstrap/bootstrap.html'),
            filename: path.join(buildDir, 'connect-popup/bootstrap.html'),
        }),
    ],
};

export default merge([
    createBaseConfig({ suiteType: 'web', baseDir, assetPrefix }),
    ...(isDev ? [createDevConfig({ distPath: buildDir, port: DEV_PORT })] : []),
    webConfig,
]);
