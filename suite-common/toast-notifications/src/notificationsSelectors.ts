import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';

import {
    TRANSACTION_BROADCAST_NOTIFICATION_TYPES,
    type TransactionBroadcastNotificationType,
} from './constants';
import { isTransactionNotification } from './notificationsUtils';
import {
    type NotificationEntry,
    type NotificationsRootState,
    type ToastPayload,
    type TransactionNotification,
} from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<NotificationsRootState>();

export const selectNotifications = (state: NotificationsRootState) => state.notifications;

export const selectTransactionNotifications = createMemoizedSelector(
    [selectNotifications],
    (notifications): TransactionNotification[] => notifications.filter(isTransactionNotification),
);

export const selectHasUnseenTransactionNotifications = (state: NotificationsRootState): boolean =>
    state.notifications?.some(n => !n.seen && isTransactionNotification(n)) ?? false;

export const selectVisibleNotificationsByType = createMemoizedSelector(
    [
        selectNotifications,
        (_state: NotificationsRootState, notificationType: ToastPayload[keyof ToastPayload]) =>
            notificationType,
    ],
    (notifications, notificationType) =>
        returnStableArrayIfEmpty(
            notifications.filter(
                notification => notification.type === notificationType && !notification.closed,
            ),
        ),
);

type TransactionBroadcastNotification = Extract<
    NotificationEntry,
    { type: TransactionBroadcastNotificationType }
>;

const isTransactionBroadcastNotification = (
    notification: NotificationEntry,
): notification is TransactionBroadcastNotification =>
    'txid' in notification &&
    TRANSACTION_BROADCAST_NOTIFICATION_TYPES.some(type => type === notification.type);

export const selectTransactionBroadcastNotificationByTxid = createMemoizedSelector(
    [selectNotifications, (_state: NotificationsRootState, txid: string) => txid],
    (notifications, txid): TransactionBroadcastNotification | undefined =>
        notifications.find(
            (notification): notification is TransactionBroadcastNotification =>
                isTransactionBroadcastNotification(notification) && notification.txid === txid,
        ),
);
