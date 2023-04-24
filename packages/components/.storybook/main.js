const path = require('path');

module.exports = {
    stories: ['../src/**/*.stories.*'],
    logLevel: 'debug',
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
    core: {
        builder: 'webpack5',
    },
    staticDirs: ['../public'],
};
