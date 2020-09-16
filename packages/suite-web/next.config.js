const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const withCustomBabelConfig = require('next-plugin-custom-babel-config');
const withTranspileModules = require('next-transpile-modules');
const withImages = require('next-images');
const withWorkers = require('@zeit/next-workers');

const GitRevisionPlugin = require('git-revision-webpack-plugin');
const webpack = require('webpack');
const packageJson = require('./package.json');

const gitRevisionPlugin = new GitRevisionPlugin();
module.exports = withBundleAnalyzer(
    withCustomBabelConfig(
        withTranspileModules(
            withImages(
                withWorkers({
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
                    workerLoaderOptions: {
                        name: 'static/[hash].worker.js',
                        publicPath: '/_next/',
                    },
                    experimental: {
                        productionBrowserSourceMaps: true,
                    },
                    webpack: (config, options) => {
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
        ),
    ),
);
