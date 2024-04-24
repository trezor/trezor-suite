import { Meta, StoryObj } from '@storybook/react';
import { HotkeyBadge as HotkeyBadgeComponent, HotkeyBadgeProps } from './HotkeyBadge';

const meta: Meta = {
    title: 'Form/HotkeyBadge',
    component: HotkeyBadgeComponent,
} as Meta;
export default meta;

const Component = ({ children, ...args }: HotkeyBadgeProps) => {
    return <HotkeyBadgeComponent {...args}>{children}</HotkeyBadgeComponent>;
};

export const HotkeyBadge: StoryObj<HotkeyBadgeProps> = {
    render: Component,
    args: {
        children: 'CMD + P',
        isActive: true,
    },
};
