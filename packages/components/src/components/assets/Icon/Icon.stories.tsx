import { Meta, StoryObj } from '@storybook/react';
import { Icon as IconComponent, IconProps, variables } from '../../../index';

const meta: Meta = {
    title: 'Assets/Icons',
    component: IconComponent,
} as Meta;
export default meta;

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
