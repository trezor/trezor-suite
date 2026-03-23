import type { Meta, StoryObj } from '@storybook/react-native';

import { COLOR_TOKENS, nativeTypographyStyles } from '@trezor/theme';

import { Text as TextComponent, type TextProps } from '../Text';

type TextStory = StoryObj<TextProps>;

const meta: Meta<TextProps> = {
    title: 'Atoms',
    component: TextComponent,
};

export default meta;

export const Text: TextStory = {
    name: 'Text',
    args: {
        children: 'Text value',
        variant: 'body-md',
        color: 'textDefault',
        textAlign: 'left',
    },
    argTypes: {
        children: {
            control: { type: 'text' },
        },
        variant: {
            control: { type: 'select' },
            options: nativeTypographyStyles,
        },
        textAlign: {
            control: { type: 'select' },
            options: ['left', 'center', 'right'],
        },
        color: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
    },
};
