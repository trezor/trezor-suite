import { createSelector } from '@reduxjs/toolkit';

import { NotificationsRootState, NotificationsState, ToastPayload } from './types';

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
