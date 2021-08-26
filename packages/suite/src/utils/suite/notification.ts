import { NotificationEntry } from '@suite-reducers/notificationReducer';
import { ToastNotificationVariant, AppState } from '@suite-types';
import { colors } from '@trezor/components';

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

export const getVariantColor = (variant: ViewProps['variant']) => {
    switch (variant) {
        case 'info':
            return colors.TYPE_BLUE;
        case 'warning':
            return colors.TYPE_ORANGE;
        case 'error':
            return colors.TYPE_RED;
        case 'success':
            return colors.TYPE_GREEN;
        case 'transparent':
        default:
            return 'transparent';
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
