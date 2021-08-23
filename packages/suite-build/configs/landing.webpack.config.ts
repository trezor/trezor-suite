import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { PuppeteerPrerenderPlugin } from 'puppeteer-prerender-plugin';
import { FLAGS } from '../../suite/src/config/suite/features';

import { assetPrefix, isDev } from '../utils/env';
import { getPathForProject } from '../utils/path';

const routes = [
    {
        name: 'landing-start',
        pattern: '/start/',
    },
    {
        name: 'landing-index',
        pattern: '/',
    },
];

// Configuration for HTML output (html-webpack-plugin)
const htmlConfig = {
    minify: false, // !isDev,
    templateParameters: {
        assetPrefix,
        isOnionLocation: FLAGS.ONION_LOCATION_META,
    },
    inject: 'body' as const,
    scriptLoading: 'blocking' as const,
};

const baseDir = getPathForProject('landing');
const config: webpack.Configuration = {
    entry: [path.join(baseDir, 'src', 'support', 'index.tsx')],
    output: {
        path: path.join(baseDir, 'build'),
        globalObject: 'this',
        libraryTarget: 'umd',
    },
    plugins: [
        new CopyPlugin({
            patterns: ['fonts', 'images', 'translations'].map(dir => ({
                from: path.join(__dirname, '..', '..', 'suite-data', 'files', dir),
                to: path.join(baseDir, 'build', 'static', dir),
            })),
            options: {
                concurrency: 100,
            },
        }),
        // Html files
        ...routes.map(
            route =>
                new HtmlWebpackPlugin({
                    ...htmlConfig,
                    template: path.join(baseDir, 'src', 'static', 'index.html'),
                    filename: path.join(baseDir, 'build', route.pattern, 'index.html'),
                }),
        ),
        new PuppeteerPrerenderPlugin({
            enabled: !isDev,
            renderAfterEvent: '__RENDERED__',
            entryDir: path.join(baseDir, 'build'),
            outputDir: 'dist',
            postProcess: result => {
                result.html = result.html
                    .replace(/<script (.*?)>/g, '<script $1 defer>')
                    .replace('id="app"', 'id="app" data-server-rendered="true"');
            },
            routes: routes.map(r => r.pattern),
            puppeteerOptions: {
                // Needed to run inside Docker
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
        }),

        ...(isDev ? [new ReactRefreshWebpackPlugin()] : []),
    ],
};

export default config;
