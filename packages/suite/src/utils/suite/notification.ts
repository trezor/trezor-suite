import { NotificationEntry } from '@suite-reducers/notificationReducer';
import { ToastNotificationVariant, AppState } from '@suite-types';

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

export const getSeenAndUnseenNotifications = (notifications: AppState['notifications']) => {
    const seen: Array<NotificationEntry> = [];
    const unseen: Array<NotificationEntry> = [];

    // loop over all notifications and check which of them there were seen or not
    notifications.forEach(notification => {
        if (notification.seen) {
            seen.push(notification);
        } else {
            unseen.push(notification);
        }
    });

    return { seenNotifications: seen, unseenNotifications: unseen };
};
