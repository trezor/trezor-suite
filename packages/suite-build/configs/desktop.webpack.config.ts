import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import { FLAGS } from '@suite-common/suite-config';

import { AssetsFilterPlugin } from '../plugins/assets-filter-plugin';
import { NixosInterpreterPlugin } from '../plugins/nixos-interpreter-plugin';
import ShellSpawnPlugin from '../plugins/shell-spawn-plugin';
import { assetPrefix, isCodesignBuild, isDev, launchElectron } from '../utils/env';
import { getPathForProject } from '../utils/path';

const electronArgsIndex = process.argv.indexOf('./webpack.config.ts') + 1;
const electronArgs = process.argv.slice(electronArgsIndex);

const baseDirUI = getPathForProject('desktop-ui');
const baseDir = getPathForProject('desktop');

// conditionally remove bluetooth binaries from the build, see https://github.com/trezor/trezor-suite/pull/18196
// to be removed when BT is ready
const BLUETOOTH_BIN_FILTER = !isDev && !process.env.BLUETOOTH ? [/bin\/bluetooth\//] : [];

const config: webpack.Configuration = {
    // Electron 36 runs on Chromium 136 https://www.electronjs.org/blog/electron-36-0#stack-changes
    // but we are limited to 133 (supported by latest browserslist, as included by latest webpack)
    target: 'browserslist:Chrome >= 133',
    entry: [path.join(baseDirUI, 'src', 'index.tsx')],
    output: {
        path: path.join(baseDir, 'build'),
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: ['bin', 'fonts', 'images', 'videos', 'guide/assets']
                .map(dir => ({
                    from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                    to: path.join(baseDir, 'build', 'static', dir),
                }))
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
                ])
                // include FW binaries from @trezor/connect-common
                .concat([
                    {
                        from: path.join(__dirname, '../../', 'connect-common/files/firmware'),
                        to: path.join(baseDir, 'build/static/bin/firmware'),
                    },
                ])
                .concat(
                    isCodesignBuild
                        ? []
                        : {
                              from: path.join(
                                  __dirname,
                                  '../../',
                                  'connect-common/files/devkit/firmware',
                              ),
                              to: path.join(baseDir, 'build/static/bin/devkit/firmware'),
                          },
                )
                .concat([
                    {
                        from: path.join(__dirname, '../../', 'transport-bridge/dist/ui'),
                        to: path.join(baseDir, 'build/node-bridge/ui'),
                    },
                ])
                .concat([
                    {
                        from: path.join(__dirname, '../../', 'suite-desktop/releaseNotes'),
                        to: path.join(baseDir, 'build'),
                    },
                ]),
            options: {
                concurrency: 100,
            },
        }),
        new AssetsFilterPlugin({
            test: BLUETOOTH_BIN_FILTER,
        }),
        new HtmlWebpackPlugin({
            minify: !isDev,
            template: path.join(baseDirUI, 'src', 'static', 'index.html'),
            templateParameters: {
                assetPrefix,
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
