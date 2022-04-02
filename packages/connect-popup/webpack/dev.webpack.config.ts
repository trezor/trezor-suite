import path from 'path';
import { merge } from 'webpack-merge';
import { WebpackPluginServe } from 'webpack-plugin-serve';
import prod from './prod.webpack.config';

const dev = {
    mode: 'development',
    watch: true,
    devtool: 'eval-source-map',
    output: {
        filename: '[name].js',
    },
    plugins: [
        new WebpackPluginServe({
            port: 8088,
            hmr: true,
            static: [path.join(__dirname, '../build')],
        }),
    ],
};

export default merge([prod, dev]);
