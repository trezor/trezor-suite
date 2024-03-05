import { Meta, StoryObj } from '@storybook/react';
import { ProgressBar as ProgressBarComponent, ProgressBarProps } from './ProgressBar';

const meta: Meta = {
    title: 'Loaders/ProgressBar',
    component: ProgressBarComponent,
} as Meta;
export default meta;

export const ProgressBar: StoryObj<ProgressBarProps> = {
    args: {
        max: 100,
        value: 21,
    },
};
