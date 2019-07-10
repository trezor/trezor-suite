import React from 'react';
// import { LOCATION_CHANGE } from '@suite-actions/routerActions';
import * as NOTIFICATION from '@wallet-actions/constants/notification';
import { DEVICE } from 'trezor-connect';
import { Action } from '@suite-types/index';

export interface CallbackAction {
    label: React.ReactNode;
    callback: () => any;
}

export interface NotificationEntry {
    key: string;
    id?: string;
    devicePath?: string;
    variant: 'success' | 'warning' | 'info' | 'error';
    title: React.ReactNode | string;
    message?: React.ReactNode;
    cancelable?: boolean;
    actions?: CallbackAction[];
}

export type State = NotificationEntry[];

const initialState: State = [
    // {
    //     id: undefined,
    //     type: "info",
    //     title: "Some static notification",
    //     message: "This one is not cancelable",
    //     cancelable: false,
    //     actions: []
    // }
];

const addNotification = (state: State, payload: any): State => {
    const newState: State = state.filter(e => !e.cancelable);
    newState.push({
        key: new Date().getTime().toString(),
        id: payload.id,
        devicePath: payload.devicePath,
        variant: payload.variant,
        title: payload.title,
        message: payload.message,
        cancelable: payload.cancelable,
        actions: payload.actions,
    });

    // TODO: sort
    return newState;
};

const closeNotification = (state: State, payload: any): State => {
    if (payload && typeof payload.id === 'string') {
        return state.filter(entry => entry.id !== payload.id);
    }
    if (payload && typeof payload.devicePath === 'string') {
        return state.filter(entry => entry.devicePath !== payload.devicePath);
    }
    return state.filter(entry => !entry.cancelable);
};

export default function notification(state: State = initialState, action: Action): State {
    switch (action.type) {
        case DEVICE.DISCONNECT: {
            const { path } = action.payload;
            return state.filter(entry => entry.devicePath !== path);
        }

        case NOTIFICATION.ADD:
            return addNotification(state, action.payload);

        // TODO
        // case LOCATION_CHANGE:
        case NOTIFICATION.CLOSE:
            return closeNotification(state, action.payload);
        // no default
    }
}
