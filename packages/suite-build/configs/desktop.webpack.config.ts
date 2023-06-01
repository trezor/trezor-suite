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
    target: 'browserslist:Chrome >= 111', // Electron 24 is running on chromium 112 (browserlist doesn't know 112 yet)
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
                // include FW binaries from @trezor/connect-iframe
                .concat([
                    {
                        from: path.join(__dirname, '../../', 'connect-iframe/build/data/firmware'),
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
                                  'connect-iframe/build/data/devkit/firmware',
                              ),
                              to: path.join(baseDir, 'build/static/bin/devkit/firmware'),
                          },
                ),
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
