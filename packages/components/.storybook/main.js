module.exports = {
    stories: ['../src/**/*.stories.*'],
    logLevel: 'debug',
    webpackFinal: async config => {
        return config;
    },
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-knobs',
        '@storybook/addon-viewport',
    ],
    typescript: {
        check: false,
        checkOptions: {},
        // reactDocgenTypescriptOptions: {
        //   propFilter: (prop) => ['label', 'disabled'].includes(prop.name),
        // },
      },
};
