const path = require('path');
const webpack = require('webpack');
const withOptimizedImages = require('next-optimized-images');
const withVideos = require('next-videos');
// Get Suite App version from the Suite package.json
const { suiteVersion } = require('../suite/package.json');

const { dependencies } = require('./package.json');

// we definitely wan't to transpile all our local packages
const localPackages = Object.keys(dependencies).filter(packageName =>
    packageName.match(/^@trezor/),
);
const withTranspileModules = require('next-transpile-modules')(localPackages);

module.exports = withTranspileModules(
    withVideos(
        withOptimizedImages({
            images: {
                disableStaticImages: true, // https://exerror.com/nextjs-typeerror-unsupported-file-type-undefined-after-update-to-v-11/
            },
            optimizeImages: false, // TODO: install optimization plugin and enable https://github.com/cyrilwanner/next-optimized-images#optimization-packages
            typescript: {
                // there is no possibility of error because TSC typecheck is run before build
                // also this probably won't work correctly with project references
                ignoreDevErrors: true,
                ignoreBuildErrors: true,
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
                        'process.env.VERSION': JSON.stringify(suiteVersion),
                        'process.env.ASSET_PREFIX': JSON.stringify(process.env.ASSET_PREFIX),
                    }),
                );

                return config;
            },
        }),
    ),
);
