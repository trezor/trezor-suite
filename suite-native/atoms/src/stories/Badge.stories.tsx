import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES, ICON_SIZES } from '@suite-native/icons';

import { BADGE_SIZES, BADGE_VARIANTS, Badge as BadgeComponent, type BadgeProps } from '../Badge';
import { SURFACE_ELEVATIONS } from '../types';

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
        variant: 'green',
        size: 'medium',
        icon: undefined,
        iconSize: 'small',
        elevation: '0',
        isDisabled: false,
    },
    argTypes: {
        label: {
            control: { type: 'text' },
        },
        variant: {
            control: { type: 'select' },
            options: BADGE_VARIANTS,
        },
        icon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        size: {
            control: { type: 'select' },
            options: BADGE_SIZES,
        },
        iconSize: {
            control: { type: 'select' },
            options: ICON_SIZES,
        },
        elevation: {
            control: { type: 'select' },
            options: SURFACE_ELEVATIONS,
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
    },
};
