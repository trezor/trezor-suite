import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { FLAGS } from '../../suite/src/config/suite/features';

import { assetPrefix, isDev, launchElectron } from '../utils/env';
import { getPathForProject } from '../utils/path';
import ShellSpawnPlugin from '../plugins/shell-spawn-plugin';

const baseDir = getPathForProject('desktop');
const config: webpack.Configuration = {
    target: 'browserslist:Chrome >= 93', // electron 14
    entry: [path.join(baseDir, 'src', 'index.tsx')],
    output: {
        path: path.join(baseDir, 'build'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                'bin',
                'fonts',
                'guide',
                'images',
                'message-system',
                'translations',
                'videos',
            ]
                .map(dir => ({
                    from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                    to: path.join(baseDir, 'build', 'static', dir),
                }))
                .concat([
                    {
                        from: path.join(__dirname, '..', '..', 'connect-iframe', 'build'),
                        to: path.join(baseDir, 'build', 'static', 'connect'),
                    },
                ]),
            options: {
                concurrency: 100,
            },
        }),
        new HtmlWebpackPlugin({
            minify: !isDev,
            template: path.join(baseDir, 'src', 'static', 'index.html'),
            templateParameters: {
                assetPrefix,
                isOnionLocation: FLAGS.ONION_LOCATION_META,
            },
            filename: path.join(baseDir, 'build', 'index.html'),
        }),
        new ShellSpawnPlugin({
            cwd: baseDir,
            runAfterBuild: [
                {
                    command: 'chmod',
                    args: ['-R', '+x', path.join(baseDir, 'build', 'static', 'bin')],
                },
                ...(launchElectron
                    ? [
                          {
                              command: 'yarn',
                              args: ['run', 'dev:prepare'],
                          },
                          {
                              command: 'yarn',
                              args: ['run', 'dev:run'],
                          },
                      ]
                    : []),
            ],
        }),
    ],
};

export default config;
