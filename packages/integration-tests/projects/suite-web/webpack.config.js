/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-destructuring */

const babel = require('../../../suite-web/babel.config');

// get babel config
const babelOptions = babel({ cache: () => {} });
// adjust paths
const alternatedPaths = {};
const moduleResolverOptionsIndex = babelOptions.plugins.findIndex(o => o[0] === 'module-resolver');
Object.entries(babelOptions.plugins[moduleResolverOptionsIndex][1].alias).forEach(a => {
    // if it is relative path, move it two levels up
    if (a[1].startsWith('.')) {
        alternatedPaths[a[0]] = `../../${a[1]}`;
    } else {
        alternatedPaths[a[0]] = a[1];
    }
});

babelOptions.plugins[moduleResolverOptionsIndex][1].alias = alternatedPaths;

module.exports = {
    mode: 'development',
    // webpack will transpile TS and JS files
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                // every time webpack sees a TS file (except for node_modules)
                // webpack will use "ts-loader" to transpile it to JavaScript
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
                            // skip typechecking for speed
                            transpileOnly: true,
                        },
                    },
                ],
            },
        ],
    },
};
