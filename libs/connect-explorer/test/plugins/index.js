// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
const webpack = require('@cypress/webpack-preprocessor');
const babelConfig = require('../../babel.config');
// const webpack

module.exports = on => {
    const options = {
        webpackOptions: {
            resolve: {
                extensions: ['.ts', '.tsx', '.js'],
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        loader: 'ts-loader',
                        options: { transpileOnly: true },
                    },
                ],
            },
        },
    };
    on('file:preprocessor', webpack(options));
    addMatchImageSnapshotPlugin(on);
};
