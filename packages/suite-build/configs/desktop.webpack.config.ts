import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { FLAGS } from '../../suite/src/config/suite/features';

import { assetPrefix, isDev, launchElectron } from '../utils/env';
import { getPathForProject } from '../utils/path';
import ShellExecPlugin from '../plugins/shell-exec-plugin';

const baseDir = getPathForProject('desktop');
const config: webpack.Configuration = {
    target: 'web',
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
        new ShellExecPlugin({
            cwd: baseDir,
            runAfterBuild: [
                `chmod -R +x ${path.join(baseDir, 'build', 'static', 'bin')}`,
                ...(launchElectron ? ['yarn run dev:prepare && yarn run dev:run'] : []),
            ],
        }),
    ],
};

export default config;
