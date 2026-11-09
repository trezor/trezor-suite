import type { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
    stories: ['../../../suite-native/**/stories/**/*.stories.?(ts|tsx|js|jsx)'],
    deviceAddons: ['@storybook/addon-ondevice-controls'],
};

export default main;
