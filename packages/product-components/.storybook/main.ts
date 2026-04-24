import type { StorybookConfig } from '@storybook/react-webpack5';
import { createRequire } from 'module';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
    return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.*'],
    logLevel: 'debug',

    addons: [getAbsolutePath('@storybook/addon-links'), getAbsolutePath('@storybook/addon-docs')],

    staticDirs: [
        '../public',
        { from: '../../suite-data/files', to: '/static' },
        { from: '../../../suite-common/flags/assets', to: '/static' },
    ],

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

    webpackFinal: webpackConfig => {
        // Add TypeScript support
        webpackConfig.module!.rules!.push({
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

        webpackConfig.resolve!.fallback = {
            ...webpackConfig.resolve!.fallback,
            stream: false,
        };

        // NOTE: remove the previous loaders from handling the svgs
        const imageRule = webpackConfig.module!.rules!.find(
            (rule): rule is { test?: RegExp; exclude?: RegExp } =>
                (rule as { test?: RegExp })?.test?.test('.svg') ?? false,
        );
        if (imageRule) {
            imageRule.exclude = /\.svg$/;
        }

        // Configure SVG files to match the main project's webpack config
        webpackConfig.module!.rules!.push({
            test: /\.(gif|jpe?g|png|svg|webp)$/,
            type: 'asset/resource',
        });

        return webpackConfig;
    },

    docs: {},
};

// eslint-disable-next-line import/no-default-export
export default config;
