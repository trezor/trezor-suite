import {
    type TransactionEntry,
    type TransactionNotificationType,
} from '@suite-common/toast-notifications';

export const getTxNotificationFields = (notification: TransactionEntry) => ({
    type: notification.type as TransactionNotificationType,
    descriptor: notification.descriptor ?? '',
    symbol: 'symbol' in notification ? notification.symbol : undefined,
    txid: 'txid' in notification ? notification.txid : undefined,
    amount: 'amount' in notification ? notification.amount : undefined,
    tokenContract: 'token' in notification ? notification.token?.contract : undefined,
    tokenSymbol: 'token' in notification ? notification.token?.symbol : undefined,
    tokenDecimals: 'token' in notification ? notification.token?.decimals : undefined,
});
