import { type Meta, type StoryObj } from '@storybook/react';

import { type IconName, Toast, type ToastProps, variables } from '@trezor/components';

import { ExchangeInfoNotification } from './ExchangeInfoNotification';

const meta: Meta<typeof ExchangeInfoNotification> = {
    title: 'Notifications/ExchangeInfoNotification',
    component: ExchangeInfoNotification,
    parameters: {
        controls: {
            exclude: ['message', 'send', 'receive', 'renderAmount'],
        },
    },
};

export default meta;

type NotificationVariant = 'success' | 'info' | 'warning' | 'error' | 'transparent';

type ExchangeInfoToastStoryArgs = {
    variant: NotificationVariant;
    icon?: IconName;
    dismissible: boolean;
};

const mapNotificationVariantToIntent = (variant: NotificationVariant): ToastProps['intent'] => {
    const variantMap: Record<NotificationVariant, ToastProps['intent']> = {
        success: 'brand',
        info: 'info',
        warning: 'warning',
        error: 'critical',
        transparent: 'neutral',
    };

    return variantMap[variant];
};

const exchangeInfoContent = (
    <ExchangeInfoNotification
        message="Swap transaction from Solana #1 to Ethereum #1 was broadcast"
        send={{
            symbol: 'sol',
            amount: 3,
            displaySymbol: 'SOL',
            coingeckoId: 'solana',
        }}
        receive={{
            symbol: 'eth',
            amount: 0.0051663,
            displaySymbol: 'ETH',
            coingeckoId: 'ethereum',
        }}
    />
);

export const Default: StoryObj<typeof ExchangeInfoNotification> = {
    render: () => exchangeInfoContent,
};

export const InToast: StoryObj<ExchangeInfoToastStoryArgs> = {
    args: {
        variant: 'success',
        icon: 'arrowUp',
        dismissible: true,
    },
    argTypes: {
        variant: {
            control: {
                type: 'select',
            },
            options: ['success', 'info', 'warning', 'error', 'transparent'],
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
    },
    render: ({ variant, icon, dismissible }) => (
        <Toast
            intent={mapNotificationVariantToIntent(variant)}
            icon={icon}
            dismissible={dismissible}
            content={exchangeInfoContent}
        />
    ),
};
