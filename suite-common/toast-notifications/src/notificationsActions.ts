import { createAction } from '@reduxjs/toolkit';

import { createActionWithExtraDeps } from '@suite-common/redux-utils';

import { selectVisibleNotificationsByType } from './notificationsSelectors';
import {
    type AddNotificationAction,
    type NotificationEntry,
    type NotificationEventPayload,
    type NotificationId,
    type ToastPayload,
} from './types';

export const ACTION_PREFIX = '@common/in-app-notifications';

const close = createAction(`${ACTION_PREFIX}/close`, (id: NotificationId) => ({
    payload: id,
}));

const resetUnseen = createAction(
    `${ACTION_PREFIX}/resetUnseen`,
    (payload?: NotificationEntry[]) => ({
        payload,
    }),
);

const remove = createAction(
    `${ACTION_PREFIX}/remove`,
    (payload: NotificationEntry[] | NotificationEntry) => ({
        payload,
    }),
);

// Shared function to transform payload to NotificationEntry
const toastPayloadTransform = (payload: ToastPayload): NotificationEntry => ({
    context: 'toast' as const,
    id: new Date().getTime(),
    seen: true,
    ...payload,
});

export const addToast = createAction(
    `${ACTION_PREFIX}/addToast`,
    (payload: ToastPayload): AddNotificationAction => ({
        payload: toastPayloadTransform(payload),
    }),
);

// Adds a Toast if there is not one of same type visible.
export const addToastOnce = createActionWithExtraDeps(
    `${ACTION_PREFIX}/addToastOnce`,
    (payload: ToastPayload, { getState }): NotificationEntry | undefined => {
        const notifications = selectVisibleNotificationsByType(getState(), payload.type);
        if (notifications.length > 0) {
            return;
        }

        return toastPayloadTransform(payload);
    },
);

export const addEvent = createAction(
    `${ACTION_PREFIX}/addEvent`,
    (payload: NotificationEventPayload): AddNotificationAction => ({
        payload: {
            context: 'event',
            id: new Date().getTime(),
            ...payload,
        },
    }),
);

export const notificationsActions = {
    close,
    resetUnseen,
    remove,
    addToast,
    addEvent,
    addToastOnce,
};
