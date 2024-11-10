import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';

import {
    NotificationId,
    NotificationsRootState,
    ToastPayload,
    TransactionNotification,
} from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<NotificationsRootState>();

export const selectNotifications = (state: NotificationsRootState) => state.notifications;

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

export const selectTransactionNotificationById = createMemoizedSelector(
    [
        selectNotifications,
        (_state: NotificationsRootState, notificationId: NotificationId) => notificationId,
    ],
    (notifications, notificationId): TransactionNotification | null =>
        (notifications.find(
            notification => notification.id === notificationId,
        ) as TransactionNotification) ?? null,
);

export const selectOpenedTransactionNotifications = createMemoizedSelector(
    [selectNotifications],
    notifications =>
        returnStableArrayIfEmpty(
            notifications.filter(
                n =>
                    !n.closed &&
                    (n.type === 'tx-received' || n.type === 'tx-sent' || n.type === 'tx-confirmed'),
            ) as TransactionNotification[],
        ),
);
