/* @flow */


import { LOCATION_CHANGE } from 'react-router-redux';
import * as NOTIFICATION from '../actions/constants/notification';
import { DEVICE } from 'trezor-connect';

import type { Action } from '~/flowtype';

export type CallbackAction = {
    label: string;
    callback: Function;
}

export type NotificationEntry = {
    +id: ?string;
    +devicePath: ?string;
    +type: string;
    +title: string;
    +message: string;
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
        id: payload.id,
        devicePath: payload.devicePath,
        type: payload.type,
        title: payload.title.toString(),
        message: payload.message.toString(),
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
        case DEVICE.DISCONNECT:
            const path: string = action.device.path; // Flow warning
            return state.filter(entry => entry.devicePath !== path);

        case NOTIFICATION.ADD:
            return addNotification(state, action.payload);

        case LOCATION_CHANGE:
        case NOTIFICATION.CLOSE:
            return closeNotification(state, action.payload);

        default:
            return state;
    }
}
