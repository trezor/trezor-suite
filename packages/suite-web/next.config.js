const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const withCustomBabelConfig = require('next-plugin-custom-babel-config');
const withTranspileModules = require('next-transpile-modules');
const withImages = require('next-images');

const GitRevisionPlugin = require('git-revision-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ObsoleteWebpackPlugin = require('obsolete-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const packageJson = require('./package.json');
const WebpackModuleNomodulePlugin = require('webpack-module-nomodule-plugin');

const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = withBundleAnalyzer(
    withCustomBabelConfig(
        withTranspileModules(
            withImages({
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
                        new HtmlWebpackPlugin(),
                        new ObsoleteWebpackPlugin({
                            name: 'obsolete',
                        }),
                        new ScriptExtHtmlWebpackPlugin({
                            async: 'obsolete',
                        }),
                        new WebpackModuleNomodulePlugin('legacy'),
                        new WebpackModuleNomodulePlugin('modern'),
                    );
                    return config;
                },
            }),
        ),
    ),
);
