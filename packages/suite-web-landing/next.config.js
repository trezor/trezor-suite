const path = require('path');
const webpack = require('webpack');
const withCustomBabelConfig = require('next-plugin-custom-babel-config');
const withTranspileModules = require('next-transpile-modules');
const withImages = require('next-images');
const packageJson = require('./package.json');

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
            trailingSlash: true,
            assetPrefix: process.env.assetPrefix || '',
            webpack: (config, options) => {
                config.plugins.push(
                    new webpack.DefinePlugin({
                        'process.env.VERSION': JSON.stringify(packageJson.version),
                    }),
                );

                return config;
            },
        }),
    ),
);
