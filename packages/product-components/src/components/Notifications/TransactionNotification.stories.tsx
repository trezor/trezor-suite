import { type Meta, type StoryObj } from '@storybook/react';

import { type IconComponent, Toast, type ToastProps } from '@trezor/components';
import { ArrowDownIcon, ArrowUpIcon } from '@trezor/icons';
import { typedObjectKeys } from '@trezor/utils';

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
        toastIcon?: IconComponent;
        intent: ToastProps['intent'];
        message: string;
        amount: string;
        transaction: Pick<TransactionNotificationProps, 'notificationType' | 'symbol' | 'token'>;
    }
> = {
    'tx-received': {
        toastIcon: ArrowDownIcon,
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
        toastIcon: ArrowUpIcon,
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
        toastIcon: ArrowUpIcon,
        intent: 'brand',
        message: 'Claimed',
        amount: '101.6 SOL',
        transaction: {
            notificationType: 'tx-claimed',
            symbol: 'sol',
        },
    },
    'tx-unstaked': {
        toastIcon: ArrowUpIcon,
        intent: 'brand',
        message: 'Unstaked',
        amount: '4.6 ETH',
        transaction: {
            notificationType: 'tx-unstaked',
            symbol: 'eth',
        },
    },
    'tx-staked': {
        toastIcon: ArrowUpIcon,
        intent: 'brand',
        message: 'Staked from Ethereum #1',
        amount: '4.6 ETH',
        transaction: {
            notificationType: 'tx-staked',
            symbol: 'eth',
        },
    },
    'tx-approved': {
        toastIcon: ArrowUpIcon,
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
        toastIcon: ArrowUpIcon,
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
    'raw-tx-sent': {
        toastIcon: ArrowUpIcon,
        intent: 'brand',
        message: 'Raw transaction sent from Ethereum #1',
        amount: '',
        transaction: {
            notificationType: 'raw-tx-sent',
            symbol: 'eth',
        },
    },
    'tx-yield-deposit': {
        toastIcon: ArrowUpIcon,
        intent: 'brand',
        message: 'Deposited from Base #1',
        amount: '150 USDC',
        transaction: {
            notificationType: 'tx-yield-deposit',
            symbol: 'base',
            token: {
                contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                name: 'USD Coin',
                symbol: 'USDC',
            },
        },
    },
    'tx-yield-withdraw': {
        toastIcon: ArrowUpIcon,
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
        toastIcon: ArrowUpIcon,
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
    'tx-wrap': {
        toastIcon: ArrowUpIcon,
        intent: 'brand',
        message: 'Wrap transaction from Ethereum #1 has been broadcast',
        amount: '1.495 WETH',
        transaction: {
            notificationType: 'tx-wrap',
            symbol: 'eth',
        },
    },
    'tx-unwrap': {
        toastIcon: ArrowUpIcon,
        intent: 'brand',
        message: 'Unwrap transaction from Ethereum #1 has been broadcast',
        amount: '1.495 ETH',
        transaction: {
            notificationType: 'tx-unwrap',
            symbol: 'eth',
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
            options: typedObjectKeys(transactionNotificationConfig),
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
