import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import routes from '../../suite/src/config/suite/routes';
import { FLAGS } from '../../suite/src/config/suite/features';

import { assetPrefix, isDev } from '../utils/env';
import { getPathForProject } from '../utils/path';

// Configuration for HTML output (html-webpack-plugin)
const htmlConfig = {
    minify: false, // !isDev,
    templateParameters: {
        assetPrefix,
        isOnionLocation: FLAGS.ONION_LOCATION_META,
    },
    inject: 'body' as const,
    scriptLoading: 'blocking' as const,
};

const baseDir = getPathForProject('web');
const config: webpack.Configuration = {
    entry: [path.join(baseDir, 'src', 'index.ts')],
    output: {
        path: path.join(baseDir, 'build'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                'browser-detection',
                'connect',
                'fonts',
                'guide',
                'images',
                'message-system',
                'oauth',
                'translations',
                'videos',
            ].map(dir => ({
                from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                to: path.join(baseDir, 'build', 'static', dir),
            })),
            options: {
                concurrency: 100,
            },
        }),
        // Html files
        ...routes.map(
            route =>
                new HtmlWebpackPlugin({
                    ...htmlConfig,
                    template: path.join(baseDir, 'src', 'static', 'index.html'),
                    filename: path.join(baseDir, 'build', route.pattern, 'index.html'),
                }),
        ),
        ...(isDev ? [new ReactRefreshWebpackPlugin()] : []),
    ],
};

export default config;
