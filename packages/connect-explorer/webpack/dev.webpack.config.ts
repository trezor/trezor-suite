import webpack from 'webpack';
import path from 'path';
import { merge } from 'webpack-merge';
import { WebpackPluginServe } from 'webpack-plugin-serve';

import popup from '../../connect-popup/webpack/prod.webpack.config';
import iframe from '../../connect-iframe/webpack/prod.webpack.config';
import prod from './prod.webpack.config';

const dev: webpack.Configuration = {
    mode: 'development',
    watch: true,
    devtool: 'eval-source-map',
    entry: {
        index: path.resolve(__dirname, '../src/index.tsx'),
    },
    output: {
        filename: '[name].js',
    },
    plugins: [
        new WebpackPluginServe({
            port: 8088,
            hmr: true,
            static: [
                path.join(__dirname, '../build'),
                path.join(__dirname, '../../connect-popup/build'),
                path.join(__dirname, '../../connect-iframe/build'),
                path.join(__dirname, '../../connect-web/build'),
            ],
        }),
    ],
};

export default merge([iframe, popup, prod, dev]);
