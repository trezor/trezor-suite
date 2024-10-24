import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';

import baseConfig from './base.webpack.config';

const DIST = path.resolve(__dirname, '../build');

export const config: webpack.Configuration = {
    target: 'web',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
        core: path.resolve(__dirname, '../../connect/src/core/index.ts'),
    },
    output: {
        filename: 'js/[name].js',
        path: DIST,
        publicPath: './static/connect',
        library: {
            type: 'module',
        },
    },
    experiments: {
        outputModule: true,
    },
    // todo: nx implicit dependencies
};

export default merge([config, baseConfig]);
