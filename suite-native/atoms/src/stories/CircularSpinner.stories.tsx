import type { Meta, StoryObj } from '@storybook/react-native';

import { COLOR_TOKENS } from '@trezor/theme';

import {
    CircularSpinner as CircularSpinnerComponent,
    type CircularSpinnerProps,
} from '../CircularSpinner';

type CircularSpinnerStory = StoryObj<CircularSpinnerProps>;

const meta: Meta<CircularSpinnerProps> = {
    title: 'Atoms',
    component: CircularSpinnerComponent,
};

export default meta;

export const CircularSpinner: CircularSpinnerStory = {
    name: 'CircularSpinner',
    args: {
        size: 50,
        color: 'textDefault',
        width: 5,
    },
    argTypes: {
        size: {
            control: { type: 'number' },
        },
        color: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        width: {
            control: { type: 'number' },
        },
    },
};
