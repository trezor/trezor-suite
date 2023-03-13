import { createSelector } from '@reduxjs/toolkit';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    NotificationId,
    NotificationsRootState,
    NotificationsState,
    ToastPayload,
    TransactionNotification,
} from './types';

export const selectNotifications = (state: NotificationsRootState) => state.notifications;

export const selectVisibleNotificationsByType = createSelector(
    [
        selectNotifications,
        (_state: NotificationsRootState, notificationType: ToastPayload[keyof ToastPayload]) =>
            notificationType,
    ],
    (notifications: NotificationsState, notificationType) =>
        notifications.filter(
            notification => notification.type === notificationType && !notification.closed,
        ),
);

export const selectTransactionNotificationById = memoizeWithArgs(
    (
        state: NotificationsRootState,
        notificationId: NotificationId,
    ): TransactionNotification | null => {
        const notifications = selectNotifications(state);

        return (
            (notifications.find(
                notification => notification.id === notificationId,
            ) as TransactionNotification) ?? null
        );
    },
);

export const selectOpenedTransactionNotifications = (state: NotificationsRootState) => {
    const notifications = selectNotifications(state);

    return notifications.filter(
        n =>
            !n.closed &&
            (n.type === 'tx-received' || n.type === 'tx-sent' || n.type === 'tx-confirmed'),
    ) as TransactionNotification[];
};
