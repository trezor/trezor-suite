import { type TransactionNotification } from '@suite-common/toast-notifications';

export const getTxNotificationFields = (notification: TransactionNotification) => ({
    type: notification.type,
    descriptor: notification.descriptor,
    symbol: notification.symbol,
    txid: notification.txid,
    amount: 'amount' in notification ? notification.amount : undefined,
    token: 'token' in notification ? notification.token : undefined,
});
