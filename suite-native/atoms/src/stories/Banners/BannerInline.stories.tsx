import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { ALERT_BOX_INTENTS } from '../../BannerFull/types';
import {
    BannerInline as BannerInlineComponent,
    type BannerInlineProps,
} from '../../BannerInline/BannerInline';

type BannerInlineStory = StoryObj<BannerInlineProps>;

const meta: Meta<BannerInlineProps> = {
    title: 'Atoms/Banners',
    component: BannerInlineComponent,
};

export default meta;

export const BannerInline: BannerInlineStory = {
    name: 'BannerInline',
    args: {
        title: 'New version available (2.8.1).',
        buttonLabel: 'Button',
        intent: 'info',
        iconName: undefined,
        buttonProps: undefined,
        isCloseButtonDisplayed: undefined,
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        intent: {
            control: { type: 'select' },
            options: ALERT_BOX_INTENTS,
        },
        buttonLabel: {
            control: { type: 'text' },
        },
        isCloseButtonDisplayed: { type: 'boolean' },
        iconName: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        onButtonPress: {
            table: { disable: true },
        },
        buttonProps: {
            table: { disable: true },
        },
    },
};
