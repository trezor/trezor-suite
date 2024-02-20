/* eslint-disable import/no-extraneous-dependencies */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const PACKAGE_ROOT = path.normalize(path.join(__dirname, '..'));
const SRC = path.join(PACKAGE_ROOT, 'src/');
const BUILD = path.join(PACKAGE_ROOT, 'build/');

class RemoveJSFilePlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('RemoveJSFilePlugin', compilation => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'RemoveJSFilePlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
                },
                assets => {
                    // Iterate over assets and delete JavaScript files
                    Object.keys(assets).forEach(filename => {
                        if (filename.endsWith('.js')) {
                            compilation.deleteAsset(filename);
                        }
                    });
                },
            );
        });
    }
}

module.exports = {
    target: 'web',
    mode: 'production',
    entry: {
        index: `${SRC}/ui/index.ts`,
    },
    output: {
        path: BUILD,
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-typescript'],
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        mainFields: ['main', 'module'], // prevent wrapping default exports by harmony export (bignumber.js in ripple issue)
    },
    performance: {
        hints: false,
    },
    plugins: [
        // provide fallback plugins
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser',
        }),
        new HtmlWebpackPlugin({
            template: `${SRC}ui/index.html`,
            filename: 'index.html',
            inject: false,
            minify: {
                collapseWhitespace: true,
                keepClosingSlash: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyJS: true,
            },
            templateContent: ({ compilation }) => {
                const jsBundleName = Object.keys(compilation.assets).find(name =>
                    name.endsWith('.js'),
                );
                const jsBundleContent = compilation.assets[jsBundleName].source();
                const cssBundleContent = compilation.inputFileSystem.readFileSync(
                    `${SRC}ui/index.css`,
                    'utf-8',
                );
                const originalTemplate = compilation.inputFileSystem.readFileSync(
                    `${SRC}ui/index.html`,
                    'utf-8',
                );

                return originalTemplate.replace(
                    '</head>',
                    `<style>${cssBundleContent}</style><script>${jsBundleContent}</script></head>`,
                );
            },
        }),
        new RemoveJSFilePlugin(),
    ],
    optimization: {
        minimize: false,
    },
    // ignore optional modules, dependencies of "ws" lib
    externals: ['utf-8-validate', 'bufferutil'],
};
