import { type ReactNode } from 'react';

import type {
    NotificationEntry,
    TransactionNotificationType,
} from '@suite-common/toast-notifications';

export type { TransactionNotificationType };

type ExchangeToastAssetData = Extract<
    NotificationEntry,
    { type: 'tx-exchange' }
>['metadata']['send'];

export type ExchangeInfoAmountSide = 'send' | 'receive';

export type ExchangeInfoAsset = Pick<ExchangeToastAssetData, 'symbol' | 'contractAddress'> & {
    amount: ReactNode;
    displaySymbol?: string;
    icon?: ReactNode;
};

type TransactionNotificationWithToken = Extract<
    NotificationEntry,
    { type: 'tx-sent' | 'tx-received' | 'tx-confirmed' | 'tx-approved' | 'tx-revoked' }
>;

export type TransactionNotificationToken = TransactionNotificationWithToken['token'];
