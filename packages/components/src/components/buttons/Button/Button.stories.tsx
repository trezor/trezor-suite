import { Meta, StoryObj } from '@storybook/react';
import { allowedButtonFrameProps, Button as ButtonComponent, ButtonProps } from './Button';
import { getFramePropsStory } from '../../../utils/frameProps';
import { variables } from '../../../config';
import { subtleButtonVariants } from '../buttonStyleUtils';

const meta: Meta<ButtonProps> = {
    title: 'Buttons',
    component: ButtonComponent,
};

export default meta;

export const Button: StoryObj<ButtonProps> = {
    args: {
        children: 'Button label',
        variant: 'primary',
        size: 'medium',
        isDisabled: false,
        isLoading: false,
        isFullWidth: false,
        isSubtle: false,
        iconAlignment: 'left',
        title: 'Button title',
        ...getFramePropsStory(allowedButtonFrameProps).args,
    },
    argTypes: {
        children: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
            },
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
        isDisabled: {
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
        isLoading: {
            control: {
                type: 'boolean',
            },
        },
        isFullWidth: {
            control: {
                type: 'boolean',
            },
        },
        icon: {
            options: {
                'No icon': null,
                ...variables.ICONS.reduce((acc, icon) => ({ ...acc, [icon]: icon }), {}),
            },
            control: {
                type: 'select',
            },
        },
        iconSize: {
            control: {
                type: 'number',
            },
        },
        iconAlignment: {
            control: {
                type: 'radio',
            },
            options: ['left', 'right'],
        },
        title: {
            control: { type: 'text' },
        },
        ...getFramePropsStory(allowedButtonFrameProps).argTypes,
    },

    parameters: {
        controls: { expanded: true },
    },
};
