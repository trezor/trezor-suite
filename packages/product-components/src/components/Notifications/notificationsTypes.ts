import { type ReactNode } from 'react';

import type { TransactionNotificationType as ToastTransactionNotificationType } from '@suite-common/toast-notifications';

export type TransactionNotificationType = Exclude<
    ToastTransactionNotificationType,
    'tx-wrap' | 'tx-unwrap' | 'tx-exchange'
>;

export type ExchangeInfoAmountSide = 'send' | 'receive';

export type ExchangeInfoAsset = {
    amount: ReactNode;
    displaySymbol: string;
    icon: ReactNode;
};
