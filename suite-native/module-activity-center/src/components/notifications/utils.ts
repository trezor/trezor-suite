import { type TransactionNotification } from '@suite-common/toast-notifications';

export const getTxNotificationFields = (notification: TransactionNotification) => ({
    type: notification.type,
    descriptor: notification.descriptor,
    symbol: notification.symbol,
    txid: notification.txid,
    amount: 'amount' in notification ? notification.amount : undefined,
    tokenContract: 'token' in notification ? notification.token?.contract : undefined,
    tokenSymbol: 'token' in notification ? notification.token?.symbol : undefined,
    tokenDecimals: 'token' in notification ? notification.token?.decimals : undefined,
});
