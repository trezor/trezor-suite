import { dirname, join } from 'path';

module.exports = {
    stories: ['../src/**/*.stories.*'],
    logLevel: 'debug',
    addons: [
        getAbsolutePath('@storybook/addon-links'),
        getAbsolutePath('@storybook/addon-controls'),
        getAbsolutePath('@storybook/addon-knobs'),
        getAbsolutePath('@storybook/addon-viewport'),
    ],
    staticDirs: ['../public'],
    framework: {
        name: getAbsolutePath('@storybook/react-webpack5'),
        options: {},
    },
    babel: async options => {
        options.presets.push('@babel/preset-typescript');
        return options;
    },
    features: {
        storyStoreV7: false, // Remove this line when storiesOf is not used anymore
    },
};
/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, 'package.json')));
}
