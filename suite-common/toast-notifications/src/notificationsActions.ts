import { createAction } from '@reduxjs/toolkit';

import { createActionWithExtraDeps } from '@suite-common/redux-utils';

import { selectVisibleNotificationsByType } from './notificationsSelectors';
import { NotificationId, NotificationEntry, NotificationEventPayload, ToastPayload } from './types';

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

export const addToast = createActionWithExtraDeps(
    `${ACTION_PREFIX}/addToast`,
    (payload: ToastPayload, { getState, extra }): NotificationEntry => ({
        context: 'toast',
        id: new Date().getTime(),
        device: extra.selectors.selectDevice(getState()),
        seen: true,
        ...payload,
    }),
);

// Adds a Toast if there is not one of same type visible.
export const addToastOnce = createActionWithExtraDeps(
    `${ACTION_PREFIX}/addToastOnce`,
    (payload: ToastPayload, { getState, dispatch }): NotificationEntry | undefined => {
        const notifications = selectVisibleNotificationsByType(getState(), payload.type);
        if (notifications.length > 0) {
            return;
        }

        return dispatch(addToast(payload));
    },
);

export const addEvent = createActionWithExtraDeps(
    `${ACTION_PREFIX}/addEvent`,
    (payload: NotificationEventPayload, { getState, extra }): NotificationEntry => ({
        context: 'event',
        id: new Date().getTime(),
        device: extra.selectors.selectDevice(getState()),
        ...payload,
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
