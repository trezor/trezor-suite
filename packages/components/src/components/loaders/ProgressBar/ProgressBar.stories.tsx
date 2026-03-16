import { type Meta, type StoryObj } from '@storybook/react';

import { ProgressBar as ProgressBarComponent, type ProgressBarProps } from './ProgressBar';

const meta: Meta<typeof ProgressBarComponent> = {
    title: 'ProgressBar',
    component: ProgressBarComponent,
};
export default meta;

export const ProgressBar: StoryObj<ProgressBarProps> = {
    args: {
        max: 100,
        value: 21,
    },
};
