/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const withTranspileModules = require('next-transpile-modules')([
    '@trezor',
    '../packages/suite/src', // issue: https://github.com/zeit/next.js/issues/5666
    '@components',
    '../packages/components/src',
]);
const withOptimizedImages = require('next-optimized-images');
const withVideos = require('next-videos');
const withWorkers = require('@zeit/next-workers');

const GitRevisionPlugin = require('git-revision-webpack-plugin');
const webpack = require('webpack');
const packageJson = require('./package.json');

const gitRevisionPlugin = new GitRevisionPlugin();

/* TODO:
 * After feat/tschuss-next is merged, move development key to constants file or its own file
 * to avoid duplication in suite-web and suite-desktop package.
 * Do not forget to move process.env.PUBLIC_KEY and process.env.CODESIGN_BUILD to new webpack files.
 */

/* Only CI jobs flagged with "codesign", sign message system config by production private key.
 * All other branches use development key. */
const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';
let JWS_PUBLIC_KEY;

if (isCodesignBuild) {
    console.log('Bundling production JWS public key.');

    JWS_PUBLIC_KEY = fs.readFileSync(process.env.JWS_PUBLIC_KEY_FILE, 'utf-8');
} else {
    console.log('Bundling develop JWS public key.');

    JWS_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END PUBLIC KEY-----`;
}

module.exports = withBundleAnalyzer(
    withOptimizedImages(
        withVideos(
            withTranspileModules(
                withWorkers({
                    optimizeImages: false, // TODO: install optimization plugin and enable https://github.com/cyrilwanner/next-optimized-images#optimization-packages
                    typescript: {
                        ignoreDevErrors: true,
                    },
                    inlineImageLimit: 0,
                    babelConfigFile: path.resolve('babel.config.js'),
                    // https://github.com/zeit/next.js/issues/6219
                    // target: 'serverless',
                    trailingSlash: true,
                    assetPrefix: process.env.assetPrefix || '',
                    workerLoaderOptions: {
                        name: 'static/[hash].worker.js',
                        publicPath: '/_next/',
                    },
                    productionBrowserSourceMaps: true,
                    webpack: (config, options) => {
                        config.plugins.push(
                            new webpack.DefinePlugin({
                                'process.env.SUITE_TYPE': JSON.stringify('desktop'),
                                'process.env.VERSION': JSON.stringify(packageJson.version),
                                'process.env.COMMITHASH': JSON.stringify(
                                    gitRevisionPlugin.commithash(),
                                ),
                                'process.env.PUBLIC_KEY': JSON.stringify(JWS_PUBLIC_KEY),
                                'process.env.CODESIGN_BUILD': isCodesignBuild,
                            }),
                        );
                        config.module.rules.push({
                            test: /\.md/,
                            use: [
                                options.defaultLoaders.babel,
                                {
                                    loader: 'raw-loader',
                                },
                            ],
                        });
                        // google-auth-library dependency does not have out-of-the-box browser support (is primarily aimed at nodejs)
                        // so we need to do this to make it work (at the time of writing this)
                        config.node.fs = 'empty';
                        config.node.child_process = 'empty';
                        config.node.net = 'empty';
                        config.node.tls = 'empty';

                        return config;
                    },
                    // use static BuildId so the desktop builds are deterministic
                    generateBuildId: async () => '0',
                }),
            ),
        ),
    ),
);
