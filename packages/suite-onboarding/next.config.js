const path = require('path');
const withCustomBabelConfig = require('next-plugin-custom-babel-config');
const withTranspileModules = require('next-transpile-modules');
const withImages = require('next-images');

const GitRevisionPlugin = require('git-revision-webpack-plugin');
const webpack = require('webpack');
const packageJson = require('./package.json');

const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = withCustomBabelConfig(
    withImages(
        withTranspileModules({
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
            webpack: config => {
                config.plugins.push(
                    new webpack.DefinePlugin({
                        'process.env.SUITE_TYPE': JSON.stringify('web'),
                        'process.env.VERSION': JSON.stringify(packageJson.version),
                        'process.env.assetPrefix': JSON.stringify(process.env.assetPrefix),
                        'process.env.COMMITHASH': JSON.stringify(
                            gitRevisionPlugin.commithash(),
                        ),
                    }),
                );
                return config;
            },
        }),
    ),
);