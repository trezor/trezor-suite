import { dirname, join } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, 'package.json')));
}

module.exports = {
    stories: ['../src/**/*.stories.*'],
    logLevel: 'debug',

    addons: [
        getAbsolutePath('@storybook/addon-links'),
        getAbsolutePath('@storybook/addon-controls'),
        getAbsolutePath('@storybook/addon-viewport'),
        getAbsolutePath('@storybook/addon-actions'),
        getAbsolutePath('@storybook/addon-docs'),
    ],

    staticDirs: ['../public', { from: '../../suite-data/files', to: '/static' }],

    framework: {
        name: getAbsolutePath('@storybook/react-webpack5'),
        options: {},
    },

    typescript: {
        check: false, // Disable type checking
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
            skipChildrenPropWithoutDoc: false,
        },
    },

    webpackFinal: config => {
        // Add TypeScript support
        config.module.rules.push({
            test: /\.tsx?$/,
            use: [
                {
                    loader: require.resolve('babel-loader'),
                    options: {
                        presets: [
                            '@babel/preset-env',
                            ['@babel/preset-react', { runtime: 'automatic' }],
                            '@babel/preset-typescript',
                        ],
                    },
                },
            ],
        });

        // NOTE: remove the previous loaders from handling the svgs
        const imageRule = config.module.rules.find(rule => rule?.['test']?.test('.svg'));
        if (imageRule) {
            imageRule['exclude'] = /\.svg$/;
        }

        // Configure SVG files to match the main project's webpack config
        config.module.rules.push({
            test: /\.(gif|jpe?g|png|svg)$/,
            type: 'asset/resource',
        });

        return config;
    },

    docs: {},
};
