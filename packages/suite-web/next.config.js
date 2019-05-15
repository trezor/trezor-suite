const path = require('path');
const withCustomBabelConfig = require('next-plugin-custom-babel-config');
const withTranspileModules = require('next-transpile-modules');
const withTypescript = require('@zeit/next-typescript');

module.exports = withCustomBabelConfig(
    withTypescript(
        withTranspileModules({
            babelConfigFile: path.resolve('babel.config.js'),
            // https://github.com/zeit/next.js/issues/6219
            // target: 'serverless',
            transpileModules: [
                '@trezor', '../packages/suite/src', // issue: https://github.com/zeit/next.js/issues/5666
                '@components', '../packages/components/src',
            ],
        }),
    ),
);
