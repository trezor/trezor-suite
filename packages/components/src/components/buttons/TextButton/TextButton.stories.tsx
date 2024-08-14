import { Meta, StoryObj } from '@storybook/react';
import { TextButton as TextButtonComponent, TextButtonProps } from './TextButton';
import { variables } from '../../../config';

const meta: Meta = {
    title: 'Buttons',
    component: TextButtonComponent,
} as Meta;
export default meta;

export const TextButton: StoryObj<TextButtonProps> = {
    args: {
        children: 'Button label',
        iconAlignment: 'left',
        size: 'large',
        isDisabled: false,
        isLoading: false,
    },
    argTypes: {
        children: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
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
        iconAlignment: {
            control: {
                type: 'radio',
            },
            options: ['left', 'right'],
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
        isLoading: {
            control: {
                type: 'boolean',
            },
        },
        title: {
            control: { type: 'text' },
        },
    },
};
