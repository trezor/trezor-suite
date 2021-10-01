const path = require('path');

module.exports = {
    stories: ['../src/**/*.stories.*'],
    logLevel: 'debug',
    webpackFinal: async config => {
        // for typescript use ts-loader@8.3.0 compatible with webpack@4 (storybook dependency)
        // probably may be removed after storybook@6.4.0 with webpack@5 support
        config.module.rules.unshift({
            test: /\.tsx?$/,
            loader: path.resolve('./node_modules/ts-loader/index.js'),
        })
        return config;
    },
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-knobs', // DEPRECATED
        '@storybook/addon-viewport',
        '@storybook/addon-controls',
    ],
    typescript: {
        check: false,
        checkOptions: {},
        // reactDocgenTypescriptOptions: {
        //   propFilter: (prop) => ['label', 'disabled'].includes(prop.name),
        // },
    },
};
