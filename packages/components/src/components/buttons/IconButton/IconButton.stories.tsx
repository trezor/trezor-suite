import { Meta, StoryObj } from '@storybook/react';

import { IconButton as IconButtonComponent, IconButtonProps } from './IconButton';
import { Icon } from '../../Icon/Icon';
import { iconNames } from '../../Icon/constants';
import { buttonSizes, buttonVariants, subtleButtonVariants } from '../buttonStyleUtils';

const meta: Meta = {
    title: 'Buttons',
    component: IconButtonComponent,
} as Meta;
export default meta;

export const IconButton: StoryObj<IconButtonProps> = {
    args: {
        label: 'label',
        icon: <Icon name="arrowRight" />,
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
            options: iconNames,
            control: {
                type: 'select',
            },
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
