import { Meta, StoryObj } from '@storybook/react';
import { Icon as IconComponent, IconProps, variables } from '../../../index';

export default {
    title: 'Assets/Icons',
    component: IconComponent,
} as Meta;

export const Icon: StoryObj<IconProps> = {
    args: {
        icon: 'ARROW_DOWN',
    },
    argTypes: {
        icon: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
    },
};
