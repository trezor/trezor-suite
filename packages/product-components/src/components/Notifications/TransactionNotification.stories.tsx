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
type TransactionNotificationType = TransactionNotificationProps['notificationType'];

type TransactionToastStoryArgs = {
    notificationType: TransactionNotificationType;
};

const transactionNotificationConfig: Record<
    TransactionNotificationType,
    {
        toastIcon?: IconName;
        intent: ToastProps['intent'];
        message: string;
        amount: string;
        transaction: Pick<
            TransactionNotificationProps,
            'notificationType' | 'symbol' | 'accountSymbol' | 'token'
        >;
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
            accountSymbol: 'eth',
        },
    },
    'tx-confirmed': {
        intent: 'info',
        message: 'Transaction in Ethereum #1 confirmed',
        amount: '4.6 ETH',
        transaction: {
            notificationType: 'tx-confirmed',
            symbol: 'eth',
            accountSymbol: 'eth',
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
            accountSymbol: 'eth',
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
            accountSymbol: 'sol',
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
            accountSymbol: 'eth',
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
            accountSymbol: 'eth',
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
            accountSymbol: 'eth',
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
            accountSymbol: 'eth',
            token: {
                contract: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
                name: 'LINK',
                symbol: 'LINK',
            },
        },
    },
};

export const Default: Story = {
    args: {
        message: 'Sent from Ethereum #1',
        notificationType: 'tx-sent',
        symbol: 'eth',
        accountSymbol: 'eth',
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
            options: [
                'tx-sent',
                'tx-received',
                'tx-revoked',
                'tx-claimed',
                'tx-unstaked',
                'tx-staked',
                'tx-approved',
                'tx-confirmed',
            ],
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
