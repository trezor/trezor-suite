import type { Meta, StoryObj } from '@storybook/react-native';

import { icons } from '@suite-native/icons';

import {
    ROUNDED_ICON_INTENTS,
    ROUNDED_ICON_SIZES,
    RoundedIcon as RoundedIconComponent,
    type RoundedIconProps,
} from '../RoundedIcon';

type RoundedIconStory = StoryObj<RoundedIconProps>;

const meta: Meta<RoundedIconProps> = {
    title: 'Atoms',
    component: RoundedIconComponent,
};

export default meta;

export const RoundedIcon: RoundedIconStory = {
    name: 'RoundedIcon',
    args: {
        name: 'flag',
        intent: 'neutral',
        size: 48,
    },
    argTypes: {
        name: {
            control: { type: 'select' },
            options: Object.keys(icons),
        },
        intent: {
            control: { type: 'select' },
            options: ROUNDED_ICON_INTENTS,
        },
        size: {
            control: { type: 'select' },
            options: ROUNDED_ICON_SIZES,
        },
        symbol: {
            control: false,
        },
    },
};
