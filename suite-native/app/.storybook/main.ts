import type { StorybookConfig } from '@storybook/react-native-web-vite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function getAbsolutePath(value: string): any {
    return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const main: StorybookConfig = {
    stories: ['../.rnstorybook/stories/**/*.stories.@(js|jsx|ts|tsx)'],

    addons: [getAbsolutePath('@storybook/addon-docs'), getAbsolutePath('@chromatic-com/storybook')],

    framework: {
        name: getAbsolutePath('@storybook/react-native-web-vite'),
        options: {},
    },
};

// eslint-disable-next-line import/no-default-export
export default main;
