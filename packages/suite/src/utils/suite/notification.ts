import { type TranslationKey } from '@suite/intl';
import { type NotificationsState } from '@suite-common/toast-notifications';
import { CheckIcon, InfoIcon, WarningIcon } from '@trezor/icons';

import { type ToastNotificationVariant } from 'src/types/suite';

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

// Filters notifications which should not be visible in the notifications popup.
export const filterNonActivityNotifications = (
    notifications: NotificationsState<TranslationKey>,
): NotificationsState<TranslationKey> =>
    notifications.filter(notification => notification.type !== 'coin-scheme-protocol');

// transaction-related notifications (sent/received/confirmed, staking, yield, exchange, claims)
export const isTransactionNotification = (
    notification: NotificationsState<TranslationKey>[number],
) =>
    notification.type.startsWith('tx-') ||
    notification.type === 'raw-tx-sent' ||
    notification.type === 'successful-claim';

export const getSeenAndUnseenNotifications = (
    notifications: NotificationsState<TranslationKey>,
): {
    seenNotifications: NotificationsState<TranslationKey>;
    unseenNotifications: NotificationsState<TranslationKey>;
} => {
    const seen: NotificationsState<TranslationKey> = [];
    const unseen: NotificationsState<TranslationKey> = [];

    // Splits notifications based on whether they were seen.
    filterNonActivityNotifications(notifications).forEach(notification => {
        if (notification.seen) {
            seen.push(notification);
        } else {
            unseen.push(notification);
        }
    });

    return { seenNotifications: seen, unseenNotifications: unseen };
};
