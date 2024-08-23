import { NotificationEntry } from '@suite-common/toast-notifications';
import { colors } from '@trezor/components';
import { ToastNotificationVariant, AppState } from 'src/types/suite';
import type { NotificationViewProps } from 'src/components/suite';

export const getNotificationIcon = (variant: ToastNotificationVariant) => {
    switch (variant) {
        case 'info':
            return 'INFO';
        case 'warning':
            return 'WARNING';
        case 'error':
            return 'WARNING';
        case 'success':
            return 'CHECK';
        // no default
    }
};

export const getVariantColor = (variant: NotificationViewProps['variant']) => {
    switch (variant) {
        case 'info':
            return colors.legacy.TYPE_BLUE;
        case 'warning':
            return colors.legacy.TYPE_ORANGE;
        case 'error':
            return colors.legacy.TYPE_RED;
        case 'success':
            return colors.legacy.TYPE_GREEN;
        case 'transparent':
        default:
            return 'transparent';
    }
};

// filter notifications which should not be visible in notifications popup
export const filterNonActivityNotifications = (notifications: AppState['notifications']) =>
    notifications.filter(notification => notification.type !== 'coin-scheme-protocol');

export const getSeenAndUnseenNotifications = (notifications: AppState['notifications']) => {
    const seen: Array<NotificationEntry> = [];
    const unseen: Array<NotificationEntry> = [];

    // loop over all notifications and check which of them there were seen or not
    filterNonActivityNotifications(notifications).forEach(notification => {
        if (notification.seen) {
            seen.push(notification);
        } else {
            unseen.push(notification);
        }
    });

    return { seenNotifications: seen, unseenNotifications: unseen };
};
