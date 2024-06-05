import { Meta, StoryObj } from '@storybook/react';
import { Icon as IconComponent, IconProps, variables, IconVariant } from '../../../index';

const meta: Meta = {
    title: 'Assets/Icons',
    component: IconComponent,
} as Meta;
export default meta;

export const Icon: StoryObj<IconProps> = {
    args: {
        icon: 'TAG',
        variant: 'primary',
    },
    argTypes: {
        icon: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
        variant: {
            options: ['primary', 'tertiary', 'info', 'destructive', 'warning'] as IconVariant[],
            control: {
                type: 'select',
            },
        },
        color: {
            options: [undefined, '#9be887'],
            control: {
                type: 'select',
            },
        },
    },
};
