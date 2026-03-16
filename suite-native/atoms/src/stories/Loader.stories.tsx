import type { Meta, StoryObj } from '@storybook/react-native';

import { COLOR_TOKENS } from '@trezor/theme';

import { Loader as LoaderComponent, type LoaderProps } from '../Loader';

type LoaderStory = StoryObj<LoaderProps>;

const meta: Meta<LoaderProps> = {
    title: 'Atoms',
    component: LoaderComponent,
};

export default meta;

export const Loader: LoaderStory = {
    name: 'Loader',
    args: {
        size: 'large',
        title: 'Loading...',
        color: 'backgroundPrimaryDefault',
    },
    argTypes: {
        size: {
            control: { type: 'select' },
            options: ['small', 'large'],
        },
        title: {
            control: { type: 'text' },
        },
        color: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
    },
};
