import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

import routes from '../../suite/src/config/suite/routes';
import { FLAGS } from '../../suite/src/config/suite/features';

import { assetPrefix, isDev } from '../utils/env';
import { getPathForProject } from '../utils/path';

const baseDir = getPathForProject('web');
const config: webpack.Configuration = {
    target: 'browserslist',
    entry: [path.join(baseDir, 'src', 'index.ts')],
    output: {
        path: path.join(baseDir, 'build'),
    },
    plugins: [
        new CopyPlugin({
            patterns: ['browser-detection', 'fonts', 'images', 'message-system', 'oauth', 'videos']
                .map(dir => ({
                    from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                    to: path.join(baseDir, 'build', 'static', dir),
                }))
                .concat([
                    {
                        from: path.join(__dirname, '..', '..', 'connect-iframe', 'build'),
                        to: path.join(baseDir, 'build', 'static', 'connect'),
                    },
                ]),
            options: {
                concurrency: 100,
            },
        }),
        // Html files
        ...routes.map(
            route =>
                new HtmlWebpackPlugin({
                    minify: isDev
                        ? false
                        : {
                              collapseWhitespace: true,
                              keepClosingSlash: true,
                              removeComments: true,
                              removeRedundantAttributes: true,
                              removeScriptTypeAttributes: true,
                              removeStyleLinkTypeAttributes: true,
                              useShortDoctype: true,
                              minifyJS: true,
                          },
                    templateParameters: {
                        assetPrefix,
                        isOnionLocation: FLAGS.ONION_LOCATION_META,
                    },
                    inject: 'body' as const,
                    scriptLoading: 'blocking' as const,
                    template: path.join(baseDir, 'src', 'static', 'index.html'),
                    filename: path.join(baseDir, 'build', route.pattern, 'index.html'),
                }),
        ),
        ...(!isDev ? [new CssMinimizerPlugin()] : []),
    ],
};

export default config;
