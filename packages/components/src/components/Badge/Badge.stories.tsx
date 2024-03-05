import { Meta, StoryObj } from '@storybook/react';
import { Badge as BadgeComponent, BadgeProps } from './Badge';

const meta: Meta = {
    title: 'Misc/Badge',
    component: BadgeComponent,
} as Meta;
export default meta;

export const Badge: StoryObj<BadgeProps> = {
    args: {
        children: 'Badge label',
    },
};
