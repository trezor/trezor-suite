import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { FLAGS } from '@suite-common/suite-config';

import { assetPrefix, isDev, launchElectron, isCodesignBuild } from '../utils/env';
import { getPathForProject } from '../utils/path';
import { NixosInterpreterPlugin } from '../plugins/nixos-interpreter-plugin';
import ShellSpawnPlugin from '../plugins/shell-spawn-plugin';

const electronArgsIndex = process.argv.indexOf('./webpack.config.ts') + 1;
const electronArgs = process.argv.slice(electronArgsIndex);

const baseDirUI = getPathForProject('desktop-ui');
const baseDir = getPathForProject('desktop');

const config: webpack.Configuration = {
    target: 'browserslist:Chrome >= 115', // Electron 26 is running on chromium 116 (browserlist doesn't know 116 yet)
    entry: [path.join(baseDirUI, 'src', 'index.tsx')],
    output: {
        path: path.join(baseDir, 'build'),
    },
    plugins: [
        new CopyPlugin({
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
                        from: path.join(__dirname, '../../', 'transport-bridge/dist'),
                        to: path.join(baseDir, 'build/node-bridge'),
                    },
                ]),
            options: {
                concurrency: 100,
            },
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
