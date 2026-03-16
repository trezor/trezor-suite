import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES, ICON_SIZES } from '@suite-native/icons';
import { nativeSpacings, nativeTypographyStyles } from '@trezor/theme';

import {
    ICON_LIST_ITEM_VARIANTS,
    IconListTextItem as IconListTextItemComponent,
    type IconListTextItemProps,
} from '../../IconListItem';

type IconListTextItemStory = StoryObj<IconListTextItemProps>;

const meta: Meta<IconListTextItemProps> = {
    title: 'Atoms/Lists',
    component: IconListTextItemComponent,
};

export default meta;

export const IconListTextItem: IconListTextItemStory = {
    name: 'IconListTextItem',
    args: {
        children: 'Text value',
        icon: 'discover',
        iconSize: 'medium',
        variant: 'default',
        verticalAlign: 'center',
        spacing: 'sp12',
    },
    argTypes: {
        children: {
            control: { type: 'text' },
        },
        icon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        iconSize: {
            control: { type: 'select' },
            options: Object.values(ICON_SIZES),
        },
        variant: {
            control: { type: 'select' },
            options: Object.values(ICON_LIST_ITEM_VARIANTS),
        },
        textVariant: {
            control: { type: 'select' },
            options: nativeTypographyStyles,
        },
        spacing: {
            control: { type: 'select' },
            options: Object.keys(nativeSpacings),
        },
        verticalAlign: {
            control: false,
        },
    },
};
