import type { Meta, StoryObj } from '@storybook/react-native';

import { ProgressBar as ProgressBarComponent, type ProgressBarProps } from '../ProgressBar';

type ProgressBarStory = StoryObj<ProgressBarProps>;

const meta: Meta<ProgressBarProps> = {
    title: 'Atoms',
    component: ProgressBarComponent,
};

export default meta;

export const ProgressBar: ProgressBarStory = {
    name: 'ProgressBar',
    args: {
        value: 50,
        max: 100,
    },
    argTypes: {
        value: {
            control: { type: 'number' },
        },
        max: {
            control: { type: 'number' },
        },
    },
};
