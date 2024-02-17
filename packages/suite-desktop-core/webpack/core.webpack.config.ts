/* eslint-disable import/no-default-export */

import fs from 'fs';
import path from 'path';
import { sync } from 'glob';
import webpack from 'webpack';
import childProcess from 'child_process';
import TerserPlugin from 'terser-webpack-plugin';

import uriSchemes from '../../suite-desktop/uriSchemes.json';
import { suiteVersion } from '../../suite/package.json';
import pkg from '../../suite-desktop/package.json';

const { NODE_ENV, IS_CODESIGN_BUILD } = process.env;

const PROJECT = 'desktop';

/* **** ENV VARIABLES **** */

const isDev = NODE_ENV !== 'production';
const isCodesignBuild = IS_CODESIGN_BUILD === 'true';

// Read signature public key
const keyPath = path.join(__dirname, '../scripts/app-key.asc');
const appKey = fs.readFileSync(keyPath, 'utf-8');

// Get git revision
const gitRevision = childProcess.execSync('git rev-parse HEAD').toString().trim();

/**
 * Assemble release name for Sentry
 * Same definition is in packages/suite-build/configs/base.webpack.config.ts,
 * but reusing is not straightforward because this is JS script run by Node during build.
 */
const sentryRelease = `${suiteVersion}.${PROJECT}${
    isCodesignBuild ? '.codesign' : ''
}.${gitRevision}`;

/* **** ENTRY POINTS **** */

const source = path.join(__dirname, '..', 'src');

const threadPath = path.join(source, 'threads');
const threads = sync(`${threadPath}/**/*.ts`).map(
    u => `threads${u.replace(threadPath, '').replace('.ts', '')}`,
);

/* **** EXTERNALS **** */

const dependencies = Object.keys(pkg.dependencies);
const devDependencies = Object.keys(pkg.devDependencies);

/* **** CONFIG **** */

const config: webpack.Configuration = {
    target: 'electron-main',
    mode: isDev ? 'development' : 'production',
    entry: ['app', 'preload', ...threads].reduce(
        (prev, cur) => ({
            ...prev,
            [cur]: path.resolve(__dirname, `../src/${cur}.ts`),
        }),
        {},
    ),
    output: {
        filename: '[name].js',
        chunkFilename: a => {
            const chunkName = a.chunk?.name;
            if (chunkName && /-worker$/.test(chunkName)) return `workers/${chunkName}.js`;
            if (chunkName && /-api$/.test(chunkName)) return `coins/${chunkName}.js`;
            return '[name].js';
        },
        path: path.resolve(__dirname, '../../suite-desktop/dist'),
        publicPath: './',
        library: { type: 'umd' },
    },
    externals: [
        ...dependencies,
        ...devDependencies,
        'bufferutil', // optional dependency of ws lib
        'memcpy', // optional depencency of bytebuffer lib
        'utf-8-validate', // optional dependency of ws lib
        'osx-temperature-sensor', // optional dependency of systeminformation lib
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-typescript'],
                    },
                },
            },
        ],
    },
    resolve: {
        modules: ['node_modules'],
        mainFields: ['module', 'main'],
        extensions: ['.ts', '.js'],
        alias: {
            '@emurgo/cardano-serialization-lib-nodejs': '@emurgo/cardano-serialization-lib-browser',
            '@trezor/connect$': '@trezor/connect/src/index', // alternative for "module": "src/index" in connect's package.json
        },
    },
    performance: {
        hints: false,
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            name(_: any, chunks: any) {
                return chunks.length === 1
                    ? chunks[0].name
                    : `shared/${chunks.map((item: any) => item.name.split('/').pop()).join('~')}`;
            },
        },
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
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
            'process.env.COMMITHASH': JSON.stringify(gitRevision),
            'process.env.APP_PUBKEY': JSON.stringify(appKey),
            'process.env.PROTOCOLS': JSON.stringify(uriSchemes),
            'process.env.VERSION': JSON.stringify(suiteVersion),
            'process.env.SENTRY_RELEASE': JSON.stringify(sentryRelease),
            'process.env.SUITE_TYPE': JSON.stringify(PROJECT),
            'process.env.IS_CODESIGN_BUILD': `"${isCodesignBuild}"`, // to keep it as string "true"/"false" and not boolean
            'process.env.NODE_BACKEND': JSON.stringify('js'),
            'process.env.WS_NO_BUFFER_UTIL': true, // ignore bufferutils import in ws lib (https://github.com/trezor/trezor-suite/pull/11225)
        }),
    ],

    // We are using WASM package - it's much faster (https://github.com/Emurgo/cardano-serialization-lib)
    // This option makes it possible
    // Unfortunately Cardano Serialization Lib triggers webpack warning:
    // "Critical dependency: the request of a dependency is an expression" due to require in generated wasm module
    // https://github.com/Emurgo/cardano-serialization-lib/issues/119
    experiments: { asyncWebAssembly: true },
    ignoreWarnings: [{ module: /cardano-serialization-lib-browser/ }],
};

export default config;
