import { NotificationEntry } from '@suite-common/toast-notifications';
import { ToastNotificationVariant, AppState } from 'src/types/suite';
import type { NotificationViewProps } from 'src/components/suite';
import { intermediaryTheme } from '@trezor/components';

export const getNotificationIcon = (variant: ToastNotificationVariant) => {
    switch (variant) {
        case 'info':
            return 'info';
        case 'warning':
            return 'warningTriangle';
        case 'error':
            return 'warningTriangle';
        case 'success':
            return 'check';
        // no default
    }
};

export const getVariantColor = (variant: NotificationViewProps['variant']) => {
    switch (variant) {
        case 'info':
            return intermediaryTheme.light.legacy.TYPE_BLUE;
        case 'warning':
            return intermediaryTheme.light.legacy.TYPE_ORANGE;
        case 'error':
            return intermediaryTheme.light.legacy.TYPE_RED;
        case 'success':
            return intermediaryTheme.light.legacy.TYPE_GREEN;
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
