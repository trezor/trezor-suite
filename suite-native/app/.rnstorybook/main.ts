import type { StorybookConfig } from '@storybook/react-native';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function getAbsolutePath(value: string): any {
    return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const main: StorybookConfig = {
    stories: ['./stories/**/*.stories.?(ts|tsx|js|jsx)'],
    addons: [
        getAbsolutePath('@storybook/addon-ondevice-controls'),
        getAbsolutePath('@storybook/addon-ondevice-actions'),
    ],
};

// eslint-disable-next-line import/no-default-export
export default main;
