import { Meta, StoryObj } from '@storybook/react';

import { ShortcutBadge as ShortcutBadgeComponent, ShortcutBadgeProps } from './ShortcutBadge';

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
