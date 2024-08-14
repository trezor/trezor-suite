import { Meta, StoryObj } from '@storybook/react';
import { HotkeyBadge as HotkeyBadgeComponent, HotkeyBadgeProps } from './HotkeyBadge';

const meta: Meta = {
    title: 'HotkeyBadge',
    component: HotkeyBadgeComponent,
} as Meta;
export default meta;

const Component = ({ ...args }: HotkeyBadgeProps) => {
    return <HotkeyBadgeComponent {...args} />;
};

export const HotkeyBadge: StoryObj<HotkeyBadgeProps> = {
    render: Component,
    args: {
        hotkey: ['CTRL', 'KEY_P'],
        isActive: true,
    },
};
