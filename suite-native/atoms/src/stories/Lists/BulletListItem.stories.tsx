import type { Meta, StoryObj } from '@storybook/react-native';

import { COLOR_TOKENS, nativeTypographyStyles } from '@trezor/theme';

import {
    BulletListItem as BulletListItemComponent,
    type BulletListItemProps,
} from '../../BulletListItem';

type BulletListItemStory = StoryObj<BulletListItemProps>;

const meta: Meta<BulletListItemProps> = {
    title: 'Atoms/Lists',
    component: BulletListItemComponent,
};

export default meta;

export const BulletListItem: BulletListItemStory = {
    name: 'BulletListItem',
    args: {
        children: 'textual bullet point',
        variant: 'body-md',
        color: 'textDefault',
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
    },
};
