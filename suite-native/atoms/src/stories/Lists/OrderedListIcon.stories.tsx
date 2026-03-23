import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_SIZES } from '@suite-native/icons';
import { COLOR_TOKENS, nativeBorders } from '@trezor/theme';

import {
    OrderedListIcon as OrderedListIconComponent,
    type OrderedListIconProps,
} from '../../OrderedListIcon';
import { HStack } from '../../Stack';
import { Text } from '../../Text';

type OrderedListIconStory = StoryObj<OrderedListIconProps>;

const meta: Meta<OrderedListIconProps> = {
    title: 'Atoms/Lists',
    component: OrderedListIconComponent,
    decorators: [
        Story => (
            <HStack spacing="sp12" alignItems="center">
                <Story />
                <Text variant="body-md">Text value</Text>
            </HStack>
        ),
    ],
};

export default meta;

export const OrderedListIcon: OrderedListIconStory = {
    name: 'OrderedListIcon',
    args: {
        iconNumber: 1,
        iconBackgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        iconBorderColor: 'borderElevation0',
        iconBorderRadius: 'r12',
        iconColor: 'textDefault',
        iconSize: 'mediumLarge',
    },
    argTypes: {
        iconNumber: {
            control: { type: 'number' },
        },
        iconBackgroundColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        iconBorderColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        iconBorderRadius: {
            control: { type: 'select' },
            options: Object.keys(nativeBorders.radii),
        },
        iconColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        iconSize: {
            control: { type: 'select' },
            options: Object.values(ICON_SIZES),
        },
    },
};
