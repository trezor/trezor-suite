import { Meta, StoryObj } from '@storybook/react';
import { IconButton as IconButtonComponent, IconButtonProps } from './IconButton';
import { variables } from '../../../config';
import { buttonSizes, buttonVariants, subtleButtonVariants } from '../buttonStyleUtils';

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
        isSubtle: false,
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
            options: buttonVariants,
        },
        size: {
            control: {
                type: 'radio',
            },
            options: buttonSizes,
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
        isSubtle: {
            control: {
                type: 'boolean',
            },
            description: `Available only for variants: <strong>${subtleButtonVariants.join(', ')}</strong>`,
        },
    },
};
