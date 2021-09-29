/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const webpack = require('webpack');
const withTranspileModules = require('next-transpile-modules')(['@trezor/suite']);
const withOptimizedImages = require('next-optimized-images');
const withVideos = require('next-videos');
// Get Suite App version from the Suite package.json
const packageJson = require('../suite/package.json');

module.exports = withTranspileModules(
    withVideos(
        withOptimizedImages({
            images: {
                disableStaticImages: true, // https://exerror.com/nextjs-typeerror-unsupported-file-type-undefined-after-update-to-v-11/
            },
            optimizeImages: false, // TODO: install optimization plugin and enable https://github.com/cyrilwanner/next-optimized-images#optimization-packages
            typescript: {
                ignoreDevErrors: true,
            },
            inlineImageLimit: 0,
            babelConfigFile: path.resolve('babel.config.js'),
            // https://github.com/zeit/next.js/issues/6219
            // target: 'serverless',
            trailingSlash: true,
            assetPrefix: process.env.ASSET_PREFIX || '',
            webpack: (config, options) => {
                config.plugins.push(
                    new webpack.DefinePlugin({
                        'process.env.VERSION': JSON.stringify(packageJson.suiteVersion),
                    }),
                );

                return config;
            },
        }),
    ),
);
