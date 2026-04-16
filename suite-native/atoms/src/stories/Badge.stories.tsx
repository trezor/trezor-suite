import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { BADGE_INTENTS, BADGE_SIZES, Badge as BadgeComponent, type BadgeProps } from '../Badge';

type BadgeStory = StoryObj<BadgeProps>;

const meta: Meta<BadgeProps> = {
    title: 'Atoms',
    component: BadgeComponent,
    render: args => <BadgeComponent {...args} style={{ alignSelf: 'center' }} />,
};

export default meta;

export const Badge: BadgeStory = {
    name: 'Badge',
    args: {
        label: 'badge',
        intent: 'brandBold',
        size: 'medium',
        icon: undefined,
    },
    argTypes: {
        label: {
            control: { type: 'text' },
        },
        intent: {
            control: { type: 'select' },
            options: BADGE_INTENTS,
        },
        icon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        size: {
            control: { type: 'select' },
            options: BADGE_SIZES,
        },
    },
};
