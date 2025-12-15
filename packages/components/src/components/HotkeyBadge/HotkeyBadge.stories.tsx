import type { Meta, StoryObj } from '@storybook/react';

import type { HotkeyBadgeProps } from './HotkeyBadge';
import { HotkeyBadge as HotkeyBadgeComponent } from './HotkeyBadge';

const meta: Meta<typeof HotkeyBadgeComponent> = {
    title: 'HotkeyBadge',
    component: HotkeyBadgeComponent,
};
export default meta;

const Component = ({ ...args }: HotkeyBadgeProps) => <HotkeyBadgeComponent {...args} />;

export const HotkeyBadge: StoryObj<typeof meta> = {
    render: Component,
    args: {
        hotkey: ['CTRL', 'KEY_P'],
        isActive: true,
    },
};
