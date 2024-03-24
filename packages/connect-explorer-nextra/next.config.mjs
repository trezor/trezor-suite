import path from 'path';
import rehypeSectionize from '@hbsnow/rehype-sectionize';
import nextra from 'nextra';
import { execSync } from 'child_process';

const withNextra = nextra({
    theme: '@trezor/connect-explorer-theme',
    themeConfig: './theme.config.tsx',
    mdxOptions: {
        rehypePlugins: [[rehypeSectionize]],
    },
});
const commitHash = execSync('git rev-parse HEAD').toString().trim();

export default withNextra({
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

        if (process.env.BUILD_TARGET === 'webextension') {
            config.plugins.push(
                new webpack.NormalModuleReplacementPlugin(
                    /@trezor\/connect-web$/,
                    '@trezor/connect-webextension/lib/proxy',
                ),
            );
        }
        config.resolve.alias = {
            ...config.resolve.alias,
            'styled-components': path.resolve('../../node_modules', 'styled-components'),
            'next-themes': path.resolve('../../node_modules', 'next-themes'),
        };
    },
    typescript: {
        // Problems with transpiling
        ignoreBuildErrors: true,
    },
});
