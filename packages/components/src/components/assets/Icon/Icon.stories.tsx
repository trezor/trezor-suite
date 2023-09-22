import { Icon as IconComponent, IconProps, variables } from '../../../index';
import { StoryObj } from '@storybook/react';

export default {
    title: 'Assets/Icons',
    component: IconComponent,
};

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
