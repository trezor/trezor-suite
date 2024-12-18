import path from 'path';
import rspack, { Configuration } from '@rspack/core';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { FLAGS, routes } from '@suite-common/suite-config';

import { assetPrefix, isDev } from '../utils/env';
import { getPathForProject } from '../utils/path';

const baseDir = getPathForProject('web');
const config: Configuration = {
    target: 'browserslist',
    entry: [path.join(baseDir, 'src', 'index.ts')],
    output: {
        path: path.join(baseDir, 'build'),
    },
    plugins: [
        new rspack.CopyRspackPlugin({
            patterns: ['browser-detection', 'fonts', 'images', 'oauth', 'videos', 'guide/assets']
                .map(dir => ({
                    from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                    to: path.join(baseDir, 'build', 'static', dir),
                }))
                .concat([
                    {
                        from: path.join(
                            __dirname,
                            '../../../',
                            'suite-common',
                            'message-system',
                            'files',
                            'config.v1.ts',
                        ),
                        to: path.join(baseDir, 'build', 'static', 'message-system'),
                    },
                ]),
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
        // imports from @trezor/connect in @trezor/suite package need to be replaced by imports from @trezor/connect-web/src/module
        new rspack.NormalModuleReplacementPlugin(
            /@trezor\/connect$/,
            '@trezor/connect-web/src/module',
        ),
    ],
    optimization: {
        minimizer: !isDev ? [new rspack.LightningCssMinimizerRspackPlugin()] : [],
    },
};

export default config;
