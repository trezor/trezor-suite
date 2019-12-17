/* eslint-disable @typescript-eslint/no-var-requires */

const wp = require('@cypress/webpack-preprocessor');
const babel = require('../../babel.config');

// hackinsh smackish way how to make it work, I didnt want to touch app config at all
const babelOptions = babel({ cache: () => {} });

const webpackOptions = {
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: [
                    {
                        loader: 'babel-loader',
                        options: babelOptions,
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'packages/suite-web/test/tsconfig.json',
                        },
                    },
                ],
            },
        ],
    },
};

const options = {
    webpackOptions,
};

module.exports = wp(options);
