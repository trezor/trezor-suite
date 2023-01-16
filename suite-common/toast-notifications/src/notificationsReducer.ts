import { createReducer, isAnyOf } from '@reduxjs/toolkit';

import { notificationsActions } from './notificationsActions';
import { NotificationsState } from './types';

const initialState: NotificationsState = [];

export const notificationsReducer = createReducer(initialState, builder => {
    builder
        .addCase(notificationsActions.close, (state, { payload }) => {
            const item = state.find(n => n.id === payload);
            if (item) item.closed = true;
        })
        .addCase(notificationsActions.resetUnseen, (state, { payload }) => {
            if (!payload) {
                state.forEach(n => {
                    if (!n.seen) n.seen = true;
                });
            } else {
                payload.forEach(p => {
                    const item = state.find(n => n.id === p.id);
                    if (item) item.seen = true;
                });
            }
        })
        .addCase(notificationsActions.remove, (state, { payload }) => {
            const arr = !Array.isArray(payload) ? [payload] : payload;
            arr.forEach(item => {
                const index = state.findIndex(n => n.id === item.id);
                state.splice(index, 1);
            });
        })
        .addMatcher(
            isAnyOf(notificationsActions.addEvent, notificationsActions.addToast),
            (state, { payload }) => {
                state.unshift(payload);
            },
        );
});
