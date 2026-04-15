import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { Toast as ToastComponent } from '../components/Toast';
import { type ToastVariant } from '../toastsAtoms';

const TOAST_VARIANTS: ToastVariant[] = ['default', 'success', 'warning', 'error', 'info'];

type ToastArgs = {
    variant: ToastVariant;
    message: string;
    icon?: (typeof ICON_NAMES)[number];
};

type ToastStory = StoryObj<ToastArgs>;

const meta: Meta<ToastArgs> = {
    title: 'Toasts',
    render: ({ variant, message, icon }) => (
        <ToastComponent
            toast={{
                id: 0,
                variant,
                message,
                icon,
            }}
        />
    ),
};

export default meta;

export const Toast: ToastStory = {
    name: 'Toast',
    args: {
        variant: 'default',
        message: 'This is a toast message.',
        icon: undefined,
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: TOAST_VARIANTS,
        },
        message: {
            control: { type: 'text' },
        },
        icon: {
            control: { type: 'select' },
            options: [undefined, ...ICON_NAMES],
        },
    },
};
