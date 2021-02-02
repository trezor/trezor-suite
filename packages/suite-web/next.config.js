const path = require('path');
const withWorkers = require('@zeit/next-workers');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const webpack = require('webpack');
const packageJson = require('./package.json');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const withTranspileModules = require('next-transpile-modules')([
    '@trezor', // TODO: this probably doesn't do anything as @trezor is not valid package name
    '../packages/suite/src', // issue: https://github.com/zeit/next.js/issues/5666
]);
const withOptimizedImages = require('next-optimized-images');

const gitRevisionPlugin = new GitRevisionPlugin();
module.exports = withOptimizedImages(
    withBundleAnalyzer(
        withTranspileModules(
            withWorkers({
                optimizeImages: false, // TODO: install optimization plugin and enable https://github.com/cyrilwanner/next-optimized-images#optimization-packages
                typescript: {
                    ignoreDevErrors: true,
                },
                inlineImageLimit: 0,
                babelConfigFile: path.resolve('babel.config.js'),
                // https://github.com/zeit/next.js/issues/6219
                // target: 'serverless',
                trailingSlash: true,
                assetPrefix: process.env.assetPrefix || '',
                workerLoaderOptions: {
                    name: 'static/[hash].worker.js',
                    publicPath: '/_next/',
                },
                productionBrowserSourceMaps: true,
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
                    // google-auth-library dependency does not have out-of-the-box browser support (is primarily aimed at nodejs)
                    // so we need to do this to make it work (at the time of writing this)
                    config.node.fs = 'empty';
                    config.node.child_process = 'empty';
                    config.node.net = 'empty';
                    config.node.tls = 'empty';

                    return config;
                },
            }),
        ),
    ),
);
