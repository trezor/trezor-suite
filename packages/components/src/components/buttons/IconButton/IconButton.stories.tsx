import { Meta, StoryObj } from '@storybook/react';
import { IconButton as IconButtonComponent, IconButtonProps } from './IconButton';
import { variables } from '../../../config';

const meta: Meta = {
    title: 'Buttons',
    component: IconButtonComponent,
} as Meta;
export default meta;

export const IconButton: StoryObj<IconButtonProps> = {
    args: {
        label: 'label',
        icon: 'ARROW_RIGHT_LONG',
        variant: 'primary',
        size: 'large',
        isDisabled: false,
        isLoading: false,
    },
    argTypes: {
        label: {
            type: 'string',
        },
        icon: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
        bottomLabel: {
            type: 'string',
        },
        variant: {
            control: {
                type: 'radio',
            },
            options: ['primary', 'secondary', 'tertiary', 'info', 'warning', 'destructive'],
        },
        size: {
            control: {
                type: 'radio',
            },
            options: ['large', 'medium', 'small', 'tiny'],
        },
        iconSize: {
            control: {
                type: 'number',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isLoading: {
            control: {
                type: 'boolean',
            },
        },
    },
};
