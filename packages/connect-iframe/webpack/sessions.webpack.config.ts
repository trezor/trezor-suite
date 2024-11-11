import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';

import { config as baseConfig } from './base.webpack.config';

const basePath = path.join(__dirname, '..');

const DIST = path.join(basePath, 'build');

const config: webpack.Configuration = {
    // common instructions that are able to build correctly imports from @trezor/connect (reusing this in popup)
    entry: {
        ['sessions-background-sharedworker']: {
            filename: 'workers/[name].js',
            import: path.resolve(
                __dirname,
                '../../transport/src/sessions/background-sharedworker.ts',
            ),
        },
    },
    output: {
        filename: 'js/[name].[contenthash].js',
        path: DIST,
        publicPath: './',
    },
};

export default merge([config, baseConfig]);
