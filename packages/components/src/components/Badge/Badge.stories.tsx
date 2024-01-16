import { Meta, StoryObj } from '@storybook/react';
import { Badge as BadgeComponent, BadgeProps } from './Badge';

export default {
    title: 'Misc/Badge',
    component: BadgeComponent,
} as Meta;

export const Badge: StoryObj<BadgeProps> = {
    args: {
        children: 'Badge label',
    },
};
