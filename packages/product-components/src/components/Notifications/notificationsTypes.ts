import { type ReactNode } from 'react';

import type {
    NotificationEntry,
    TransactionNotificationType as ToastTransactionNotificationType,
} from '@suite-common/toast-notifications';

export type TransactionNotificationType = Exclude<
    ToastTransactionNotificationType,
    'tx-wrap' | 'tx-unwrap'
>;

type ExchangeToastAssetData = Extract<
    NotificationEntry,
    { type: 'tx-exchange' }
>['metadata']['send'];

export type ExchangeInfoAmountSide = 'send' | 'receive';

export type ExchangeInfoAsset = Pick<ExchangeToastAssetData, 'symbol' | 'contractAddress'> & {
    amount: ReactNode;
    displaySymbol?: string;
    coingeckoId?: string;
    icon?: ReactNode;
};

type TransactionNotificationWithToken = Extract<
    NotificationEntry,
    { type: 'tx-sent' | 'tx-received' | 'tx-confirmed' | 'tx-approved' | 'tx-revoked' }
>;

export type TransactionNotificationToken = TransactionNotificationWithToken['token'];
