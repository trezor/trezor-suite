const withNextra = require('nextra')({
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.tsx',
});

const commitHash = require('child_process').execSync('git rev-parse HEAD').toString().trim();

module.exports = withNextra({
    basePath: process.env.CONNECT_EXPLORER_BASE_PATH,
    assetPrefix: process.env.CONNECT_EXPLORER_ASSET_PREFIX,
    trailingSlash: true,
    output: 'export',
    images: {
        unoptimized: true,
    },
    transpilePackages: ['@trezor/components'],
    compiler: {
        styledComponents: true,
    },
    webpack: (config, { webpack }) => {
        // Image loader
        config.module.rules.push({
            test: /\.(svg)$/,
            type: 'asset/resource',
        });

        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.__TREZOR_CONNECT_SRC': JSON.stringify(
                    process.env.__TREZOR_CONNECT_SRC,
                ),
                'process.env.COMMIT_HASH': JSON.stringify(commitHash),
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
        );
    },
    typescript: {
        // Problems with transpiling
        ignoreBuildErrors: true,
    },
});
