import { type TransactionNotification } from '@suite-common/toast-notifications';
import { isNftTokenTransfer } from '@suite-common/wallet-utils';

export const getTxNotificationFields = (notification: TransactionNotification) => {
    const token = 'token' in notification ? notification.token : undefined;

    return {
        type: notification.type,
        descriptor: notification.descriptor,
        symbol: notification.symbol,
        txid: notification.txid,
        amount: 'amount' in notification ? notification.amount : undefined,
        token,
        isNftTransfer: token !== undefined && !!isNftTokenTransfer(token),
    };
};
