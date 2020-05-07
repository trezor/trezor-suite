const path = require('path');
const withCustomBabelConfig = require('next-plugin-custom-babel-config');
const withTranspileModules = require('next-transpile-modules');
const withImages = require('next-images');

module.exports = withCustomBabelConfig(
    withTranspileModules(
        withImages({
            typescript: {
                ignoreDevErrors: true,
            },
            inlineImageLimit: 0,
            babelConfigFile: path.resolve('babel.config.js'),
            // https://github.com/zeit/next.js/issues/6219
            // target: 'serverless',
            transpileModules: [
                '@trezor',
                '../packages/suite/src', // issue: https://github.com/zeit/next.js/issues/5666
            ],
            exportTrailingSlash: true,
            assetPrefix: process.env.assetPrefix || '',
        }),
    ),
);
