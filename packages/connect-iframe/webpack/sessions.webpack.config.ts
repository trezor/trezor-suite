import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';

import { config as baseConfig } from './base.webpack.config';
import { getSharedworkerDistPathForProject } from './utils';

const project = process.env.PROJECT || 'iframe';

if (project !== 'iframe' && project !== 'suite-web') {
    throw new Error(`Unsupported project: ${project}`);
}
const DIST = getSharedworkerDistPathForProject(project);

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
