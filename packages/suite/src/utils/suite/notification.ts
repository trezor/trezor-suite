import { NotificationEntry } from '@suite-reducers/notificationReducer';
import { ToastNotificationVariant } from '@suite-types';

export const findTransactionEvents = (descriptor: string, notifications: NotificationEntry[]) =>
    notifications.filter(
        n =>
            (n.type === 'tx-sent' || n.type === 'tx-received' || n.type === 'tx-confirmed') &&
            (n.descriptor === descriptor || n.txid === descriptor),
    );

export const getNotificationIcon = (variant: ToastNotificationVariant) => {
    switch (variant) {
        case 'info':
            return 'INFO_ACTIVE';
        case 'warning':
            return 'WARNING_ACTIVE';
        case 'error':
            return 'WARNING_ACTIVE';
        case 'success':
            return 'CHECK';
        // no default
    }
};
