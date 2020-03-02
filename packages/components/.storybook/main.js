module.exports = {
    webpackFinal: async config => {
        config.module.rules.push({
            test: /\.(ts|tsx)$/,
            use: [
                {
                    loader: require.resolve('ts-loader'),
                },
                // Optional
                {
                    loader: require.resolve('react-docgen-typescript-loader'),
                },
            ],
        });
        config.resolve.extensions.push('.ts', '.tsx');
        return config;
    },
    addons: [
        '@storybook/addon-links/register',
        '@storybook/addon-knobs/register',
        '@storybook/addon-viewport/register',
    ],
};
