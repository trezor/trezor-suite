import type { StorybookConfig } from '@storybook/react-webpack5';
import { globSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
    return dirname(require.resolve(join(value, 'package.json')));
}

const repositoryRoot = join(import.meta.dirname, '../../..');
const workspacePatterns: string[] = JSON.parse(
    readFileSync(join(repositoryRoot, 'package.json'), 'utf8'),
).workspaces.packages;
const storyPattern = '**/*.stories.tsx';

const stories = globSync(
    workspacePatterns.map(pattern => `${pattern}/package.json`),
    { cwd: repositoryRoot },
)
    .toSorted()
    .map(manifestPath => {
        const directory = dirname(join(repositoryRoot, manifestPath));
        const manifest: { name: string } = JSON.parse(
            readFileSync(join(directory, 'package.json'), 'utf8'),
        );

        return { directory, files: storyPattern, titlePrefix: manifest.name };
    })
    // @trezor/suite and @trezor/product-components retain their legacy scope,
    // so their stories are included alongside the newer @suite packages.
    .filter(
        ({ titlePrefix }) =>
            titlePrefix.startsWith('@suite/') ||
            titlePrefix === '@trezor/product-components' ||
            titlePrefix === '@trezor/suite',
    )
    .filter(
        ({ directory }) =>
            globSync(storyPattern, {
                cwd: directory,
                exclude: filePath => basename(filePath) === 'node_modules',
            }).length > 0,
    );

const config: StorybookConfig = {
    stories,
    core: { disableTelemetry: true },

    addons: [getAbsolutePath('@storybook/addon-links'), getAbsolutePath('@storybook/addon-docs')],

    staticDirs: [
        '../public',
        { from: '../../../suite/app-assets/files', to: '/static' },
        { from: '../../../suite-common/flags/assets', to: '/static' },
    ],

    framework: {
        name: getAbsolutePath('@storybook/react-webpack5'),
        options: {},
    },

    typescript: {
        check: false,
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
            skipChildrenPropWithoutDoc: false,
        },
    },

    webpackFinal: webpackConfig => {
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

        // Use the same asset handling as the Suite application.
        const imageRule = webpackConfig.module!.rules!.find(
            (rule): rule is { test?: RegExp; exclude?: RegExp } =>
                (rule as { test?: RegExp })?.test?.test('.svg') ?? false,
        );
        if (imageRule) {
            imageRule.exclude = /\.svg$/;
        }

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
