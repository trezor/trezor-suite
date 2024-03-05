const withNextra = require('nextra')({
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.tsx',
});

module.exports = withNextra({
    output: 'export',
    images: {
        unoptimized: true,
    },
    transpilePackages: ['@trezor/components'],
    compiler: {
        styledComponents: true,
    },
    webpack: config => {
        // Image loader
        config.module.rules.push({
            test: /\.(svg)$/,
            type: 'asset/resource',
        });
    },
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    typescript: {
        // Problems with transpiling
        ignoreBuildErrors: true,
    },
});
