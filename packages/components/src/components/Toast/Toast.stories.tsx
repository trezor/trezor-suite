import { type Meta, type StoryObj } from '@storybook/react';

import * as generatedIcons from '@trezor/icons';

import { Toast as ToastComponent, type ToastProps } from './Toast';
import { toastIntents } from './types';

const meta: Meta<typeof ToastComponent> = {
    title: 'Toast',
    component: ToastComponent,
};
export default meta;

const actionSets: Record<string, ToastProps['actions']> = {
    None: undefined,
    'One right action': [
        {
            label: 'Retry',
            onClick: () => alert('Retry clicked'),
            position: 'right',
        },
    ],
    'Two right actions': [
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
    'One bottom action': [
        {
            label: 'Learn more',
            onClick: () => alert('Learn more clicked'),
            position: 'bottom',
        },
    ],
};

export const Toast: StoryObj<ToastProps> = {
    args: {
        content: 'This is a toast message.',
        intent: 'info',
        icon: undefined,
        actions: undefined,
        dismissible: true,
        onDismiss: () => alert('Toast closed'),
    },
    argTypes: {
        content: {
            type: 'string',
        },
        intent: {
            options: toastIntents,
            control: {
                type: 'select',
            },
        },
        icon: {
            options: ['none', ...Object.keys(generatedIcons)],
            mapping: { none: undefined, ...generatedIcons },
            control: {
                type: 'select',
            },
        },
        dismissible: {
            control: {
                type: 'boolean',
            },
        },
        actions: {
            options: Object.keys(actionSets),
            mapping: actionSets,
            control: {
                type: 'select',
            },
        },
    },
};
