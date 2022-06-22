import webpack from 'webpack';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

const config: webpack.Configuration = {
    mode: 'production',
    entry: {
        index: path.resolve(__dirname, '../src/index.tsx'),
    },
    output: {
        filename: '[name].[hash].js',
        publicPath: './',
        path: path.resolve(__dirname, '../build'),
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
                        presets: ['@babel/preset-react', '@babel/preset-typescript'],
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
    performance: {
        hints: false,
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: path.resolve(__dirname, '../src/index.html'),
            filename: 'index.html',
            inject: true,
            minify: false,
        }),
        new webpack.DefinePlugin({
            // eslint-disable-next-line no-underscore-dangle
            'process.env.__TREZOR_CONNECT_SRC': JSON.stringify(process.env.__TREZOR_CONNECT_SRC),
        }),
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
            }),
        ],
    },
};

export default config;
