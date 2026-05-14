import { type ArgTypes, type Meta, type StoryObj } from '@storybook/react';

import { Toast as ToastComponent, type ToastProps } from './Toast';
import { variables } from '../../config';

const meta: Meta<typeof ToastComponent> = {
    title: 'Toast',
    component: ToastComponent,
};
export default meta;

const args: Partial<ToastProps> | undefined = {
    content: 'This is a toast message.',
    intent: 'info',
    icon: undefined,
    dismissible: true,
    onDismiss: () => alert('Toast closed'),
};

const argTypes: Partial<ArgTypes<ToastProps>> | undefined = {
    content: {
        type: 'string',
    },
    icon: {
        options: [undefined, ...variables.ICONS],
        control: {
            type: 'select',
        },
    },
    dismissible: {
        control: {
            type: 'boolean',
        },
    },
};

export const Default: StoryObj<ToastProps> = {
    args,
    argTypes,
};

export const WithActions: StoryObj<ToastProps> = {
    args: {
        ...args,
        actions: [
            {
                label: 'Action A',
                onClick: () => alert('Action A clicked'),
                position: 'right',
            },
            {
                label: 'Action B',
                onClick: () => alert('Action B clicked'),
                position: 'right',
            },
        ],
    },
    argTypes,
};
