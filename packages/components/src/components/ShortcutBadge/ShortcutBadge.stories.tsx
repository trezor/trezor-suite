import { type Meta, type StoryObj } from '@storybook/react';

import { ShortcutBadge as ShortcutBadgeComponent, type ShortcutBadgeProps } from './ShortcutBadge';

const meta: Meta<typeof ShortcutBadgeComponent> = {
    title: 'ShortcutBadge',
    component: ShortcutBadgeComponent,
};
export default meta;

export const ShortcutBadge: StoryObj<ShortcutBadgeProps> = {
    args: {
        shortcut: ['CTRL', 'KEY_P'],
    },
};
