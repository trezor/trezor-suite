import { createSelector } from '@reduxjs/toolkit';

import {
    NotificationsRootState,
    NotificationsState,
    ToastPayload,
    TransactionEventNotification,
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

export const selectTransactionNotifications = (state: NotificationsRootState) => {
    const notifications = selectNotifications(state);

    return notifications.filter(
        n => n.type === 'tx-received' || n.type === 'tx-sent',
    ) as TransactionEventNotification[];
};
