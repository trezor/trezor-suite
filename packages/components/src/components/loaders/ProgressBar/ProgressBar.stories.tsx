import { Meta, StoryObj } from '@storybook/react';
import { ProgressBar as ProgressBarComponent, ProgressBarProps } from './ProgressBar';

export default {
    title: 'Loaders/ProgressBar',
    component: ProgressBarComponent,
} as Meta;

export const ProgressBar: StoryObj<ProgressBarProps> = {
    args: {
        max: 100,
        value: 21,
    },
};
