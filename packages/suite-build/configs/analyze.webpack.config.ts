import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const config: webpack.Configuration = {
    plugins: [new BundleAnalyzerPlugin()],
};

export default config;
