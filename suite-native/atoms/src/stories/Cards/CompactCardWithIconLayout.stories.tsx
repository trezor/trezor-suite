import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';
import { COLOR_TOKENS } from '@trezor/theme';

import { Card as CardStory } from './Card.stories';
import {
    COMPACT_CARD_VARIANTS,
    CompactCardWithIconLayout as CompactCardWithIconLayoutComponent,
    type CompactCardWithIconLayoutProps,
} from '../../Card/CompactCardWithIconLayout';

type CompactCardWithIconLayoutStory = StoryObj<CompactCardWithIconLayoutProps>;

const meta: Meta<CompactCardWithIconLayoutProps> = {
    title: 'Atoms/Cards',
    component: CompactCardWithIconLayoutComponent,
};

export default meta;

export const CompactCardWithIconLayout: CompactCardWithIconLayoutStory = {
    name: 'CompactCardWithIconLayout',
    args: {
        icon: 'flag',
        title: 'Card title that you can press to interact with',
        variant: 'primary',
        subtitle: 'This is a subtitle that you can use to describe the card',
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: COMPACT_CARD_VARIANTS,
        },
        icon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        title: {
            control: { type: 'text' },
        },
        subtitle: {
            control: { type: 'text' },
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
        noShadow: {
            control: { type: 'boolean' },
        },
        alertBoxProps: CardStory.argTypes?.alertProps,
        borderColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
    },
};
