/* eslint-disable import/no-extraneous-dependencies -- build-time tooling belongs in devDependencies */
/* eslint-disable import/no-default-export -- webpack requires a default export */
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

import { FLAGS } from '@suite-common/suite-config';
import { createBaseConfig } from '@trezor/suite/webpack/createBaseConfig';
import { createDevConfig } from '@trezor/suite/webpack/createDevConfig';
import { isCodesignBuild, isDev, isTestBuild, launchElectron } from '@trezor/suite/webpack/env';
import { NixosInterpreterPlugin } from '@trezor/suite/webpack/nixosInterpreterPlugin';
import ShellSpawnPlugin from '@trezor/suite/webpack/shellSpawnPlugin';

const electronArgsIndex = process.argv.indexOf('./webpack.config.ts') + 1;
const electronArgs = process.argv.slice(electronArgsIndex);

const rendererDir = __dirname;
const repoRoot = path.join(rendererDir, '..', '..');
/** The renderer bundle is emitted into the desktop application, which packages it. */
const baseDir = path.join(rendererDir, '..', 'desktop-app');
const buildDir = path.join(baseDir, 'build');
const appAssets = path.join(rendererDir, '..', 'app-assets', 'files');

const DEV_PORT = 8000;

/**
 * The packaged application loads from `file://`, so assets must resolve relative to the
 * application directory rather than the filesystem root.
 */
const DESKTOP_ASSET_PREFIX = '.';

const messageSystemFile = path.join(repoRoot, 'suite-common/message-system/files/config.v1.ts');
const messageSystemMockFile = path.join(
    repoRoot,
    'suite-common/message-system/build-mock/config.v1.ts',
);

/**
 * A browserslist target specific to Suite Desktop, specifying  that Chromium version which is included in the current
 * version of Electron.
 * Note that this *has* to be a separate file. Specifying it via string (e.g.`browserslist:Chrome >= 150`) should be
 * possible, but due to a bug in Webpack, it gets overriden by any browserslist file.
 *
 * Electron 43 runs on Chromium 150 https://www.electronjs.org/blog/electron-43-0
 */
const browserslistConfigPath = path.resolve(rendererDir, 'browserslist');

const rendererConfig: webpack.Configuration = {
    target: `browserslist:${browserslistConfigPath}`,
    entry: { main: [path.join(rendererDir, 'src', 'index.tsx')] },
    output: {
        path: buildDir,
        publicPath: 'auto',
    },
    resolve: {
        alias: {
            '@trezor/connect$': '@trezor/connect-electron',
            // conditionally mocks message-system config that is being used during build
            ...(isTestBuild ? { [messageSystemFile]: messageSystemMockFile } : {}),
        },
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                ...['bin', 'fonts', 'images', 'videos', 'guide/assets'].map(dir => ({
                    from: path.join(appAssets, dir),
                    to: path.join(buildDir, 'static', dir),
                })),
                {
                    from: messageSystemFile,
                    to: path.join(buildDir, 'static', 'message-system'),
                },
                // include FW binaries from @trezor/connect-common
                {
                    from: path.join(repoRoot, 'packages/connect-data/files/firmware'),
                    to: path.join(buildDir, 'static/bin/firmware'),
                },
                ...(isCodesignBuild
                    ? []
                    : [
                          {
                              from: path.join(
                                  repoRoot,
                                  'packages/connect-data/files/devkit/firmware',
                              ),
                              to: path.join(buildDir, 'static/bin/devkit/firmware'),
                          },
                      ]),
                {
                    from: path.join(repoRoot, 'packages/transport-bridge/dist/ui'),
                    to: path.join(buildDir, 'node-bridge/ui'),
                },
                {
                    from: path.join(appAssets, 'release-notes.md'),
                    to: buildDir,
                },
                {
                    from: path.join(
                        path.dirname(require.resolve('@suite-common/flags/package.json')),
                        'assets',
                        'flags',
                    ),
                    to: path.join(buildDir, 'static', 'flags'),
                },
            ],
            options: {
                concurrency: 100,
            },
        }),
        new HtmlWebpackPlugin({
            minify: !isDev,
            template: path.join(rendererDir, 'src', 'static', 'index.html'),
            templateParameters: {
                // This needs to be set as `.` so it loads from appDir of the Electron app.
                // For example (in case of AppImage): `file:///tmp/.mount_TrezorAvGo8g/resources/app.asar/build`,
                // where the  requested asset (for example: `static/fonts/fonts.css`) is located.
                assetPrefix: DESKTOP_ASSET_PREFIX,
                isOnionLocation: FLAGS.ONION_LOCATION_META,
            },
            filename: path.join(buildDir, 'index.html'),
        }),
        // conditionally patch binaries on NixOS dev build
        new NixosInterpreterPlugin({
            cwd: baseDir,
            files: [
                path.join(
                    buildDir,
                    'static/bin/coinjoin/linux-x64',
                    'WalletWasabi.WabiSabiClientLibrary',
                ),
            ],
        }),
        new ShellSpawnPlugin({
            cwd: baseDir,
            runAfterBuild: [
                {
                    command: 'chmod',
                    args: ['-R', '+x', path.join(buildDir, 'static', 'bin')],
                    isSync: true,
                },
                ...(launchElectron
                    ? [
                          {
                              command: 'yarn',
                              args: ['run', 'dev:prepare'],
                              isSync: true,
                          },
                          {
                              command: 'yarn',
                              args: ['run', 'dev:run', ...electronArgs],
                          },
                      ]
                    : []),
            ],
        }),
    ],
};

export default merge([
    createBaseConfig({
        suiteType: 'desktop',
        baseDir,
        assetPrefix: DESKTOP_ASSET_PREFIX,
        browserslistConfigPath,
    }),
    ...(isDev ? [createDevConfig({ distPath: buildDir, port: DEV_PORT })] : []),
    rendererConfig,
]);
