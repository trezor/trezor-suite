import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import { WebpackPluginServe } from 'webpack-plugin-serve';

import { DEV_PORTS } from '../utils/constants';
import { project } from '../utils/env';
import { getPathForProject } from '../utils/path';

const distPath = path.join(getPathForProject(project), 'build');
const config: webpack.Configuration = {
    stats: {
        children: true,
        errorDetails: true,
    },
    mode: 'development',
    watch: true,
    devtool: 'eval-source-map',
    entry: { main: ['webpack-plugin-serve/client'] },
    output: {
        // This builds JS directly `dist/` (instead `dist/js/`)
        // without this, Evolu worker import won't (for unknow reason) work
        // Todo: Issue is probably in combination of @evolu/sqlite-wasm which wraps `mjs` files and our webpack config
        filename: '[name].js',
        chunkFilename: '[id].js',
        // ---
    },
    watchOptions: {
        // reduce number of file watchers; for HMR it is not necessary to watch both source code & node_modules
        ignored: /node_modules/,
    },
    plugins: [
        new WebpackPluginServe({
            port: DEV_PORTS[project],
            hmr: true,
            host: 'localhost',
            static: distPath,
            progress: true,
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
