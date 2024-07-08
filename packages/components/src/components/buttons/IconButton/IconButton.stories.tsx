import { Meta, StoryObj } from '@storybook/react';
import { IconButton as IconButtonComponent, IconButtonProps } from './IconButton';
import { variables } from '../../../config';

const meta: Meta = {
    title: 'Buttons/IconButton',
    component: IconButtonComponent,
} as Meta;
export default meta;

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
        icon: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
    },
};
