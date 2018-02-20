/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import * as NOTIFICATION from '../actions/constants/notification';

type NotificationAction = {
    label: string;
    callback: any;
}

type NotificationEntry = {
    +id: ?string;
    +type: string;
    +title: string;
    +message: string;
    +cancelable: boolean;
    +actions: Array<NotificationAction>;
}

const initialState: Array<NotificationEntry> = [
    // {
    //     id: undefined,
    //     type: "info",
    //     title: "Some static notification",
    //     message: "This one is not cancelable",
    //     cancelable: false,
    //     actions: []
    // }
];

const addNotification = (state: Array<NotificationEntry>, payload: any): Array<NotificationEntry> => {
    const newState: Array<NotificationEntry> = state.filter(e => !e.cancelable);
    newState.push({
        id: payload.id,
        type: payload.type,
        title: payload.title.toString(),
        message: payload.message.toString(),
        cancelable: payload.cancelable,
        actions: payload.actions
    });

    // TODO: sort
    return newState;
}

const closeNotification = (state: Array<NotificationEntry>, payload: any): Array<NotificationEntry> => {
    if (payload && typeof payload.id === 'string') {
        return state.filter(e => e.id !== payload.id);
    } else {
        return state.filter(e => !e.cancelable);
    }
}

export default function notification(state: Array<NotificationEntry> = initialState, action: Object): Array<NotificationEntry> {
    switch(action.type) {

        case NOTIFICATION.ADD :
            return addNotification(state, action.payload);

        case LOCATION_CHANGE :
        case NOTIFICATION.CLOSE :
            return closeNotification(state, action.payload);
        
        default:
            return state;
    }
}
