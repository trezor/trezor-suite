import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';

import baseConfig from './base.webpack.config';
import { getDistPathForProject } from './utils';

const project = process.env.PROJECT || 'iframe';

if (project !== 'iframe' && project !== 'suite-web' && project !== 'popup') {
    throw new Error(`Unsupported project: ${project}`);
}
const DIST = getDistPathForProject(project);

const CORE_PUBLIC_PATH = process.env.ASSET_PREFIX ? `${process.env.ASSET_PREFIX}/` : '/';

export const config: webpack.Configuration = {
    target: 'web',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
        core: path.resolve(__dirname, '../../connect/src/core/index.ts'),
    },
    output: {
        filename: 'js/[name].js',
        path: DIST,
        publicPath: CORE_PUBLIC_PATH,
        library: {
            type: 'module',
        },
    },
    experiments: {
        outputModule: true,
    },
};

export default merge([config, baseConfig]);
