import { NotificationEntry } from '@suite-reducers/notificationReducer';

export const findTransactionEvents = (descriptor: string, notifications: NotificationEntry[]) =>
    notifications.filter(
        n =>
            (n.type === 'tx-sent' || n.type === 'tx-received' || n.type === 'tx-confirmed') &&
            (n.descriptor === descriptor || n.txid === descriptor),
    );
