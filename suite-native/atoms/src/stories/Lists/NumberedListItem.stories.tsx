import type { Meta, StoryObj } from '@storybook/react-native';

import { COLOR_TOKENS, nativeTypographyStyles } from '@trezor/theme';

import {
    NumberedListItem as NumberedListItemComponent,
    type NumberedListItemProps,
} from '../../NumberedListItem';

type NumberedListItemStory = StoryObj<NumberedListItemProps>;

const meta: Meta<NumberedListItemProps> = {
    title: 'Atoms/Lists',
    component: NumberedListItemComponent,
};

export default meta;

export const NumberedListItem: NumberedListItemStory = {
    name: 'NumberedListItem',
    args: {
        children: 'value',
        variant: 'body-md',
        color: 'contentPrimary',
        number: 1,
    },
    argTypes: {
        children: {
            control: { type: 'text' },
        },
        variant: {
            control: { type: 'select' },
            options: nativeTypographyStyles,
        },
        color: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        number: {
            control: { type: 'number' },
        },
    },
};
