import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import { FLAGS } from '@suite-common/suite-config';

import { NixosInterpreterPlugin } from '../plugins/nixos-interpreter-plugin';
import ShellSpawnPlugin from '../plugins/shell-spawn-plugin';
import { isCodesignBuild, isDev, isTestBuild, launchElectron } from '../utils/env';
import { getPathForProject } from '../utils/path';

const electronArgsIndex = process.argv.indexOf('./webpack.config.ts') + 1;
const electronArgs = process.argv.slice(electronArgsIndex);

const baseDirUI = getPathForProject('desktop-ui');
const baseDir = getPathForProject('desktop');
const messageSystemFile = path.join(
    __dirname,
    '../../../',
    'suite-common',
    'message-system',
    'files',
    'config.v1.ts',
);
const messageSystemMockFile = path.join(
    __dirname,
    '../../../',
    'suite-common',
    'message-system',
    'build-mock',
    'config.v1.ts',
);

const config: webpack.Configuration = {
    // Electron 41 runs on Chromium 146 https://www.electronjs.org/blog/electron-41-0
    target: 'browserslist:Chrome >= 146',
    entry: { main: [path.join(baseDirUI, 'src', 'index.tsx')] },
    output: {
        path: path.join(baseDir, 'build'),
        publicPath: 'auto',
    },
    resolve: {
        alias: {
            '@trezor/connect$': '@trezor/connect/src/index.renderer',
            // conditionally mocks message-system config that is being used during build
            ...(isTestBuild ? { [messageSystemFile]: messageSystemMockFile } : {}),
        },
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                ...['bin', 'fonts', 'images', 'videos', 'guide/assets'].map(dir => ({
                    from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                    to: path.join(baseDir, 'build', 'static', dir),
                })),
                {
                    from: messageSystemFile,
                    to: path.join(baseDir, 'build', 'static', 'message-system'),
                },
                // include FW binaries from @trezor/connect-common
                {
                    from: path.join(__dirname, '../../', 'connect-data/files/firmware'),
                    to: path.join(baseDir, 'build/static/bin/firmware'),
                },
                ...(isCodesignBuild
                    ? []
                    : [
                          {
                              from: path.join(
                                  __dirname,
                                  '../../',
                                  'connect-data/files/devkit/firmware',
                              ),
                              to: path.join(baseDir, 'build/static/bin/devkit/firmware'),
                          },
                      ]),
                {
                    from: path.join(__dirname, '../../', 'transport-bridge/dist/ui'),
                    to: path.join(baseDir, 'build/node-bridge/ui'),
                },
                {
                    from: path.join(__dirname, '../../', 'suite-desktop/releaseNotes'),
                    to: path.join(baseDir, 'build'),
                },
                {
                    from: path.join(
                        path.dirname(require.resolve('@suite-common/flags/package.json')),
                        'assets',
                        'flags',
                    ),
                    to: path.join(baseDir, 'build', 'static', 'flags'),
                },
            ],
            options: {
                concurrency: 100,
            },
        }),
        new HtmlWebpackPlugin({
            minify: !isDev,
            template: path.join(baseDirUI, 'src', 'static', 'index.html'),
            templateParameters: {
                // This needs to be set as `.` so it loads from appDir of the Electron app.
                // For example (in case of AppImage): `file:///tmp/.mount_TrezorAvGo8g/resources/app.asar/build`,
                // where the  requested asset (for example: `static/fonts/fonts.css`) is located.
                assetPrefix: '.',
                isOnionLocation: FLAGS.ONION_LOCATION_META,
            },
            filename: path.join(baseDir, 'build', 'index.html'),
        }),
        // conditionally patch binaries on NixOS dev build
        new NixosInterpreterPlugin({
            cwd: baseDir,
            files: [
                path.join(
                    baseDir,
                    'build/static/bin/coinjoin/linux-x64',
                    'WalletWasabi.WabiSabiClientLibrary',
                ),
            ],
        }),
        new ShellSpawnPlugin({
            cwd: baseDir,
            runAfterBuild: [
                {
                    command: 'chmod',
                    args: ['-R', '+x', path.join(baseDir, 'build', 'static', 'bin')],
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

export default config;
