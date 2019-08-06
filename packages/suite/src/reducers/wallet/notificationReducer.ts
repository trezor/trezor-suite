import React from 'react';
// import { LOCATION_CHANGE } from '@suite-actions/routerActions';
import { NOTIFICATION } from '@wallet-actions/constants';
import { DEVICE } from 'trezor-connect';
import { Action as SuiteAction } from '@suite-types';
import { Action as WalletAction } from '@wallet-types/index';

import produce from 'immer';

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

const addNotification = (state: State, payload: any) => {
    return state.push({
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

export default function notification(
    state: State = initialState,
    action: SuiteAction | WalletAction,
): State {
    return produce(state, draft => {
        switch (action.type) {
            case DEVICE.DISCONNECT: {
                const { path } = action.payload;
                draft.filter(entry => entry.devicePath !== path);
                break;
            }

            case NOTIFICATION.ADD:
                addNotification(draft, action.payload);
                break;
            // TODO
            // case LOCATION_CHANGE:
            case NOTIFICATION.CLOSE:
                closeNotification(draft, action.payload);
                break;
            // no default
        }
    });
}
