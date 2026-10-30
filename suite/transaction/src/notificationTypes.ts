import { type TransactionNotificationType as ToastTransactionNotificationType } from '@suite-common/toast-notifications';

export type TransactionNotificationType = Exclude<
    ToastTransactionNotificationType,
    'tx-exchange' | 'tx-wrap' | 'tx-unwrap'
>;

export type TransactionNotificationToken = {
    contract: string;
    name?: string;
    symbol?: string;
    decimals?: number;
};
