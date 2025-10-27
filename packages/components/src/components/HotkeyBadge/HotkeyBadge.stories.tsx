import { Meta, StoryObj } from '@storybook/react';

import { HotkeyBadge as HotkeyBadgeComponent, HotkeyBadgeProps } from './HotkeyBadge';

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
