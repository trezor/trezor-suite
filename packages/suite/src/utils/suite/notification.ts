import { TranslationKey } from '@suite/intl';
import { NotificationEntry } from '@suite-common/toast-notifications';
import { intermediaryTheme } from '@trezor/components';

import type { NotificationViewProps } from 'src/components/suite';
import { AppState, ToastNotificationVariant } from 'src/types/suite';

export const getNotificationIcon = (variant: ToastNotificationVariant) => {
    switch (variant) {
        case 'info':
            return 'info';
        case 'warning':
            return 'warning';
        case 'error':
            return 'warning';
        case 'success':
            return 'check';
        // no default
    }
};

export const getVariantColor = (variant: NotificationViewProps['variant']) => {
    switch (variant) {
        case 'info':
            return intermediaryTheme.light.textAlertBlue;
        case 'warning':
            return intermediaryTheme.light.textAlertYellow;
        case 'error':
            return intermediaryTheme.light.textAlertRed;
        case 'success':
            return intermediaryTheme.light.textPrimaryDefault;
        case 'transparent':
        default:
            return 'transparent';
    }
};

// filter notifications which should not be visible in notifications popup
export const filterNonActivityNotifications = (notifications: AppState['notifications']) =>
    notifications.filter(notification => notification.type !== 'coin-scheme-protocol');

export const getSeenAndUnseenNotifications = (notifications: AppState['notifications']) => {
    const seen: Array<NotificationEntry<TranslationKey>> = [];
    const unseen: Array<NotificationEntry<TranslationKey>> = [];

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
