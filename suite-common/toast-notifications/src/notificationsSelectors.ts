
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { isTransactionNotification } from './notificationsUtils';
import {
    type EarnTransactionStage,
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

type EarnTransactionNotification = Extract<NotificationEntry, { stage: EarnTransactionStage }>;

type EarnTransactionNotificationRef = Pick<
    EarnTransactionNotification,
    'descriptor' | 'symbol' | 'txid'
>;

export const selectEarnTransactionNotifications = (
    state: NotificationsRootState,
    { descriptor, symbol, txid }: EarnTransactionNotificationRef,
): EarnTransactionNotification[] =>
    state.notifications?.filter(
        (notification): notification is EarnTransactionNotification =>
            'stage' in notification &&
            notification.txid === txid &&
            notification.descriptor === descriptor &&
            notification.symbol === symbol,
    ) ?? [];

export const selectIsEarnTransactionConfirmationNotified = (
    state: NotificationsRootState,
    ref: EarnTransactionNotificationRef,
): boolean =>
    selectEarnTransactionNotifications(state, ref).some(
        notification => notification.stage === 'confirmed',
    );

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
