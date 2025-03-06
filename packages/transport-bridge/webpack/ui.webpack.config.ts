import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

const DIST = path.resolve(__dirname, '../dist/ui');

const config: webpack.Configuration = {
    mode: 'production',
    entry: {
        index: path.resolve(__dirname, '../src/ui/index.tsx'),
    },
    target: 'web',
    output: {
        filename: '[name].js',
        publicPath: './',
        path: DIST,
    },
    module: {
        rules: [
            {
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: [
                            [
                                '@babel/preset-react',
                                {
                                    runtime: 'automatic',
                                },
                            ],
                            '@babel/preset-typescript',
                        ],
                        plugins: [
                            [
                                'babel-plugin-styled-components',
                                {
                                    displayName: true,
                                    preprocess: true,
                                },
                            ],
                        ],
                    },
                },
            },
            {
                test: /\.(gif|jpe?g|png|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: './images/[name][contenthash][ext]',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/ui/index.html'),
            inject: 'body',
        }),
        new HtmlInlineScriptPlugin(),
    ],
};

// eslint-disable-next-line import/no-default-export
export default config;
