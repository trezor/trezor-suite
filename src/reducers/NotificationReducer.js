/* @flow */

import * as React from 'react';
import { LOCATION_CHANGE } from 'connected-react-router';
import * as NOTIFICATION from 'actions/constants/notification';
import { DEVICE } from 'trezor-connect';

import type { Action } from 'flowtype';

export type CallbackAction = {
    label: string;
    callback: Function;
}

export type NotificationEntry = {
    +key: string; // React.Key
    +id: ?string;
    +devicePath: ?string;
    +type: string;
    +title: React.Node | string;
    +message: ?(React.Node | string);
    +cancelable: boolean;
    +actions: Array<CallbackAction>;
}

export type State = Array<NotificationEntry>;

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
        type: payload.type,
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
    } if (payload && typeof payload.devicePath === 'string') {
        return state.filter(entry => entry.devicePath !== payload.devicePath);
    }
    return state.filter(entry => !entry.cancelable);
};

export default function notification(state: State = initialState, action: Action): State {
    switch (action.type) {
        case DEVICE.DISCONNECT: {
            const { path } = action.device; // Flow warning
            return state.filter(entry => entry.devicePath !== path);
        }

        case NOTIFICATION.ADD:
            return addNotification(state, action.payload);

        case LOCATION_CHANGE:
        case NOTIFICATION.CLOSE:
            return closeNotification(state, action.payload);

        default:
            return state;
    }
}
