import webpack from 'webpack';
import path from 'path';

import prod from './prod.webpack.config';

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        'content-script': path.resolve(__dirname, '../src/contentScript.ts'),
    },

    module: prod.module,
    resolve: prod.resolve,
    performance: prod.performance,

    optimization: {
        // [beta version]: keep not minimized
        minimize: false,
    },
};

// eslint-disable-next-line import/no-default-export
export default config;
