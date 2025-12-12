import type { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
    stories: ['../../**/stories/**/*.stories.?(ts|tsx|js|jsx)'],
    addons: ['@storybook/addon-ondevice-controls'],
};

// eslint-disable-next-line import/no-default-export
export default main;
