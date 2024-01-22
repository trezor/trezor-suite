import { Meta, StoryObj } from '@storybook/react';
import { IconButton as IconButtonComponent, IconButtonProps } from './IconButton';

export default {
    title: 'Buttons/IconButton',
    component: IconButtonComponent,
} as Meta;

export const IconButton: StoryObj<IconButtonProps> = {
    args: {
        label: 'label',
        icon: 'ARROW_RIGHT_LONG',
    },
    argTypes: {
        label: {
            type: 'string',
        },
        bottomLabel: {
            type: 'string',
        },
    },
};
