import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';

import { isTransactionNotification } from './notificationsUtils';
import { type NotificationsRootState, type ToastPayload } from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<NotificationsRootState>();

export const selectNotifications = (state: NotificationsRootState) => state.notifications;

export const selectHasUnseenNotifications = (state: NotificationsRootState): boolean =>
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
