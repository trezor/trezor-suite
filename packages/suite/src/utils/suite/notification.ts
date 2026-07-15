import { type TranslationKey } from '@suite/intl';
import { type NotificationEntry } from '@suite-common/toast-notifications';
import { CheckIcon, InfoIcon, WarningIcon } from '@trezor/icons';

import { type AppState, type ToastNotificationVariant } from 'src/types/suite';

export const getNotificationIcon = (variant: ToastNotificationVariant) => {
    switch (variant) {
        case 'info':
            return InfoIcon;
        case 'warning':
        case 'error':
            return WarningIcon;
        case 'success':
            return CheckIcon;
        // no default
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
