import { type Meta, type StoryObj } from '@storybook/react';

import { type IconName, Toast, type ToastProps } from '@trezor/components';

import {
    TransactionNotification,
    type TransactionNotificationProps,
} from './TransactionNotification';

const meta: Meta<typeof TransactionNotification> = {
    title: 'Notifications/TransactionNotification',
    component: TransactionNotification,
};

export default meta;

type Story = StoryObj<typeof TransactionNotification>;

type TransactionToastStoryArgs = {
    notificationType: TransactionNotificationProps['notificationType'];
};

const transactionNotificationConfig: Record<
    TransactionNotificationProps['notificationType'],
    {
        toastIcon?: IconName;
        intent: ToastProps['intent'];
        message: string;
        amount: string;
        transaction: Pick<TransactionNotificationProps, 'notificationType' | 'symbol' | 'token'>;
    }
> = {
    'tx-received': {
        toastIcon: 'arrowDown',
        intent: 'info',
        message: 'Received',
        amount: '4.6 ETH',
        transaction: {
            notificationType: 'tx-received',
            symbol: 'eth',
        },
    },
    'tx-confirmed': {
        intent: 'info',
        message: 'Transaction in Ethereum #1 confirmed',
        amount: '4.6 ETH',
        transaction: {
            notificationType: 'tx-confirmed',
            symbol: 'eth',
        },
    },
    'tx-revoked': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Revoke transaction was broadcasted',
        amount: '',
        transaction: {
            notificationType: 'tx-revoked',
            symbol: 'eth',
            token: {
                contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
                name: 'LINK',
                symbol: 'LINK',
            },
        },
    },
    'tx-claimed': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Claimed',
        amount: '101.6 SOL',
        transaction: {
            notificationType: 'tx-claimed',
            symbol: 'sol',
        },
    },
    'tx-unstaked': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Unstaked',
        amount: '4.6 ETH',
        transaction: {
            notificationType: 'tx-unstaked',
            symbol: 'eth',
        },
    },
    'tx-staked': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Staked from Ethereum #1',
        amount: '4.6 ETH',
        transaction: {
            notificationType: 'tx-staked',
            symbol: 'eth',
        },
    },
    'tx-approved': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Approve transaction was broadcasted',
        amount: '0.46024759',
        transaction: {
            notificationType: 'tx-approved',
            symbol: 'eth',
            token: {
                contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
                name: 'LINK',
                symbol: 'LINK',
            },
        },
    },
    'tx-sent': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Sent from Ethereum #1',
        amount: '0.46024759 LINK',
        transaction: {
            notificationType: 'tx-sent',
            symbol: 'eth',
            token: {
                contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
                name: 'LINK',
                symbol: 'LINK',
            },
        },
    },
    'tx-yield-supply': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Supplied from Base #1',
        amount: '150 USDC',
        transaction: {
            notificationType: 'tx-yield-supply',
            symbol: 'base',
            token: {
                contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                name: 'USD Coin',
                symbol: 'USDC',
            },
        },
    },
    'tx-yield-withdraw': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Withdrawn from Base #1',
        amount: '150 USDC',
        transaction: {
            notificationType: 'tx-yield-withdraw',
            symbol: 'base',
            token: {
                contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                name: 'USD Coin',
                symbol: 'USDC',
            },
        },
    },
    'tx-yield-claim': {
        toastIcon: 'arrowUp',
        intent: 'brand',
        message: 'Claimed from Base #1',
        amount: '150 USDC',
        transaction: {
            notificationType: 'tx-yield-claim',
            symbol: 'base',
            token: {
                contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                name: 'USD Coin',
                symbol: 'USDC',
            },
        },
    },
};

export const Default: Story = {
    args: {
        message: 'Sent from Ethereum #1',
        notificationType: 'tx-sent',
        symbol: 'eth',
        token: {
            contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            name: 'LINK',
            symbol: 'LINK',
        },
        amount: '0.46024759 LINK',
    },
};

export const InToast: StoryObj<TransactionToastStoryArgs> = {
    args: {
        notificationType: 'tx-sent',
    },
    argTypes: {
        notificationType: {
            control: {
                type: 'select',
            },
            options: Object.keys(
                transactionNotificationConfig,
            ) as (keyof typeof transactionNotificationConfig)[],
        },
    },
    render: ({ notificationType }) => {
        const config = transactionNotificationConfig[notificationType];

        return (
            <Toast
                intent={config.intent}
                icon={config.toastIcon}
                dismissible
                content={
                    <TransactionNotification
                        message={config.message}
                        amount={config.amount}
                        {...config.transaction}
                    />
                }
            />
        );
    },
};
