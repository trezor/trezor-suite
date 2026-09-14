import {
    type NotificationEntry,
    type TransactionNotificationType,
    type UnknownTranslationKey,
} from './types';

export const filterNonActivityNotifications = <T extends NotificationEntry<string>>(
    notifications: T[],
): T[] => notifications.filter(notification => notification.type !== 'coin-scheme-protocol');

export const isTransactionNotification = <TKey extends string = UnknownTranslationKey>(
    notification: NotificationEntry<TKey>,
): notification is Extract<NotificationEntry<TKey>, { type: TransactionNotificationType }> =>
    notification.type.startsWith('tx-') || notification.type === 'raw-tx-sent';

export const getSeenAndUnseenNotifications = <T extends NotificationEntry<string>>(
    notifications: T[],
): {
    seenNotifications: T[];
    unseenNotifications: T[];
} => {
    const seen: T[] = [];
    const unseen: T[] = [];

    filterNonActivityNotifications(notifications).forEach(notification => {
        if (notification.seen) {
            seen.push(notification);
        } else {
            unseen.push(notification);
        }
    });

    return { seenNotifications: seen, unseenNotifications: unseen };
};
