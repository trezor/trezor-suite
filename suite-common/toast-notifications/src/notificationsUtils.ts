import { type NotificationsState, type UnknownTranslationKey } from './types';

export const filterNonActivityNotifications = <TKey extends string = UnknownTranslationKey>(
    notifications: NotificationsState<TKey>,
): NotificationsState<TKey> =>
    notifications.filter(notification => notification.type !== 'coin-scheme-protocol');

export const isTransactionNotification = (notification: NotificationsState[number]): boolean =>
    notification.type.startsWith('tx-') ||
    notification.type === 'raw-tx-sent' ||
    notification.type === 'successful-claim';

export const getSeenAndUnseenNotifications = <TKey extends string = UnknownTranslationKey>(
    notifications: NotificationsState<TKey>,
): {
    seenNotifications: NotificationsState<TKey>;
    unseenNotifications: NotificationsState<TKey>;
} => {
    const seen: NotificationsState<TKey> = [];
    const unseen: NotificationsState<TKey> = [];

    filterNonActivityNotifications(notifications).forEach(notification => {
        if (notification.seen) {
            seen.push(notification);
        } else {
            unseen.push(notification);
        }
    });

    return { seenNotifications: seen, unseenNotifications: unseen };
};
