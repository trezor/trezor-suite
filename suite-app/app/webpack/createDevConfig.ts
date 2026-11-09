/* eslint-disable import/no-extraneous-dependencies -- build-time tooling belongs in devDependencies */
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import webpack from 'webpack';
import { WebpackPluginServe } from 'webpack-plugin-serve';

export type DevConfigOptions = {
    /** Directory the development server serves the built application from. */
    distPath: string;
    /** Port the development server listens on. */
    port: number;
};

export const createDevConfig = ({ distPath, port }: DevConfigOptions): webpack.Configuration => ({
    parallelism: 3,
    stats: {
        children: true,
        errorDetails: true,
    },
    mode: 'development',
    watch: true,
    devtool: 'eval-source-map',
    entry: { main: ['webpack-plugin-serve/client'] },
    output: {
        filename: 'js/[name].js',
        chunkFilename: ({ chunk = {} }) =>
            chunk.id && /node_modules/.test(`${chunk.id}`) ? `js/vendor/[id].js` : 'js/[id].js',
    },
    watchOptions: {
        // reduce number of file watchers; for HMR it is not necessary to watch both source code & node_modules
        ignored: /node_modules/,
    },
    plugins: [
        new WebpackPluginServe({
            port,
            hmr: true,
            host: 'localhost',
            static: distPath,
            progress: true,
            historyFallback: {
                htmlAcceptHeaders: ['text/html', '*/*'],
                rewrites: [],
            },
            client: {
                address: `localhost:${port}`,
                protocol: 'ws',
            },
        }),
        new ReactRefreshWebpackPlugin({
            overlay: false,
        }),
    ],
});
