const webpack = require('webpack');
const withOptimizedImages = require('next-optimized-images');
// Get Suite App version from the Suite package.json
const { suiteVersion } = require('../suite/package.json');

const { dependencies } = require('./package.json');

// we definitely want to transpile all our local packages
const localPackages = Object.keys(dependencies).filter(packageName =>
    packageName.match(/^@trezor/),
);
const withTranspileModules = require('next-transpile-modules')(localPackages);

module.exports = withTranspileModules(
    withOptimizedImages({
        images: {
            disableStaticImages: true, // https://exerror.com/nextjs-typeerror-unsupported-file-type-undefined-after-update-to-v-11/
        },
        typescript: {
            // there is no possibility of error because TSC typecheck is run before build
            // also this probably won't work correctly with project references
            ignoreDevErrors: true,
            ignoreBuildErrors: true,
        },
        compiler: {
            styledComponents: true,
        },
        inlineImageLimit: 0,
        // https://github.com/zeit/next.js/issues/6219
        // target: 'serverless',
        trailingSlash: true,
        assetPrefix: process.env.ASSET_PREFIX || '',
        webpack: config => {
            config.plugins.push(
                new webpack.DefinePlugin({
                    'process.env.VERSION': JSON.stringify(suiteVersion),
                    'process.env.ASSET_PREFIX': JSON.stringify(process.env.ASSET_PREFIX),
                }),
            );

            return config;
        },
    }),
);
