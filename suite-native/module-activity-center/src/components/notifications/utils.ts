import { type TransactionNotification } from '@suite-common/toast-notifications';

export const getTxNotificationFields = (notification: TransactionNotification) => ({
    type: notification.type,
    descriptor: notification.descriptor,
    symbol: notification.symbol,
    txid: notification.txid,
    formattedAmount: 'formattedAmount' in notification ? notification.formattedAmount : undefined,
    tokenContract: 'token' in notification ? notification.token?.contract : undefined,
});
