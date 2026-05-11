import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { Toast as ToastComponent } from '../components/Toast';
import { type ToastIntent } from '../toastsAtoms';

const TOAST_INTENTS: ToastIntent[] = ['neutral', 'brand', 'warning', 'critical', 'info'];

type ToastArgs = {
    intent: ToastIntent;
    message: string;
    icon?: (typeof ICON_NAMES)[number];
};

type ToastStory = StoryObj<ToastArgs>;

const meta: Meta<ToastArgs> = {
    title: 'Toasts',
    render: ({ intent, message, icon }) => (
        <ToastComponent
            toast={{
                id: 0,
                intent,
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
        intent: 'neutral',
        message: 'This is a toast message.',
        icon: undefined,
    },
    argTypes: {
        intent: {
            control: { type: 'select' },
            options: TOAST_INTENTS,
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
