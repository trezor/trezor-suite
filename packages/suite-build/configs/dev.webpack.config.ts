import path from 'path';
import webpack from 'webpack';
import { WebpackPluginServe } from 'webpack-plugin-serve';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import { project } from '../utils/env';
import { DEV_PORTS } from '../utils/constants';
import { getPathForProject } from '../utils/path';

const distPath = path.join(getPathForProject(project), 'build');
const config: webpack.Configuration = {
    stats: {
        children: true,
        errorDetails: true,
    },
    mode: 'development',
    watch: true,
    target: 'web',
    devtool: 'eval-source-map',
    entry: ['webpack-plugin-serve/client'],
    output: {
        filename: 'js/[name].js',
        chunkFilename: 'js/[id].js',
    },
    plugins: [
        new WebpackPluginServe({
            port: DEV_PORTS[project],
            hmr: true,
            static: distPath,
            progress: true,
            // @ts-ignore - https://github.com/shellscape/webpack-plugin-serve#ramdisk
            ramdisk: true,
            historyFallback: {
                htmlAcceptHeaders: ['text/html', '*/*'],
                rewrites: [],
            },
            client: {
                address: `localhost:${DEV_PORTS[project]}`,
                protocol: 'ws',
            },
        }),
        new ReactRefreshWebpackPlugin({
            overlay: false,
        }),
    ],
};

export default config;
