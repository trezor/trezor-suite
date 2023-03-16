import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import { A } from '@mobily/ts-belt';

import {
    ToastNotificationsRootState,
    ToastNotification,
    ToastNotificationWithoutId,
} from './types';

const toastNotificationsInitialState: ToastNotificationsRootState = [];

type toastNotificationsSliceRootState = {
    toastNotifications: ToastNotification[];
};
export const toastNotificationsSlice: Slice<
    ToastNotificationsRootState,
    {
        addToastNotification: (
            state: ToastNotificationsRootState,
            { payload }: PayloadAction<ToastNotificationWithoutId>,
        ) => void;
        removeToastNotification: (
            state: ToastNotificationsRootState,
            { payload }: PayloadAction<ToastNotification>,
        ) => void;
    },
    'toastNotifications'
> = createSlice({
    name: 'toastNotifications',
    initialState: toastNotificationsInitialState,
    reducers: {
        addToastNotification: (state, { payload }: PayloadAction<ToastNotificationWithoutId>) => {
            if (A.all(state, toastMessage => toastMessage.message !== payload.message)) {
                state.push({ ...payload, id: new Date().getTime() });
            }
        },
        removeToastNotification: (state, { payload }: PayloadAction<ToastNotification>) => {
            const index = state.findIndex(n => n.id === payload.id);
            state.splice(index, 1);
        },
    },
});

export const selectToastNotifications = (state: toastNotificationsSliceRootState) =>
    state.toastNotifications;

export const { addToastNotification, removeToastNotification } = toastNotificationsSlice.actions;
export const toastNotificationsReducer = toastNotificationsSlice.reducer;
