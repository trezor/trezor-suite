import {
    type TransactionEntry,
    type TransactionNotificationType,
} from '@suite-common/toast-notifications';

export const getTxNotificationFields = (notification: TransactionEntry) => ({
    type: notification.type as TransactionNotificationType,
    descriptor: notification.descriptor ?? '',
    symbol: 'symbol' in notification ? notification.symbol : undefined,
    txid: 'txid' in notification ? notification.txid : undefined,
    formattedAmount: 'formattedAmount' in notification ? notification.formattedAmount : undefined,
    tokenContract: 'token' in notification ? notification.token?.contract : undefined,
});
