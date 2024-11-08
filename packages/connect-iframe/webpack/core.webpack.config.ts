import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';

import baseConfig from './base.webpack.config';
import { getDistPathForProject } from './utils';

const project = process.env.PROJECT || 'iframe';

if (project !== 'iframe' && project !== 'suite-web') {
    throw new Error(`Unsupported project: ${project}`);
}
const DIST = getDistPathForProject(project);

export const config: webpack.Configuration = {
    target: 'web',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
        core: path.resolve(__dirname, '../../connect/src/core/index.ts'),
    },
    output: {
        filename: 'js/[name].js',
        path: DIST,
        // TODO(karliatto)
        publicPath: '/suite-web/feat/use-core-in-suite-web/web/',
        // publicPath: '/',
        library: {
            type: 'module',
        },
    },
    experiments: {
        outputModule: true,
    },
};

export default merge([config, baseConfig]);
