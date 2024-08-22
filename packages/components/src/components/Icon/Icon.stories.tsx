import { Meta, StoryObj } from '@storybook/react';
import { Icon as IconComponent, IconProps, variables, iconVariants } from '../../index';

const meta: Meta = {
    title: 'Icons',
    component: IconComponent,
} as Meta;
export default meta;

export const LegacyIcon: StoryObj<IconProps> = {
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
            options: iconVariants,
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
