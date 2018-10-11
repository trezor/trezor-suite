/* @flow */
import * as React from 'react';
import * as NOTIFICATION from 'actions/constants/notification';

import type {
    Action, AsyncAction, GetState, Dispatch, RouterLocationState,
} from 'flowtype';
import type { CallbackAction } from 'reducers/NotificationReducer';

export type NotificationAction = {
    type: typeof NOTIFICATION.ADD,
    payload: {
        +type: string,
        +title: React.Node | string,
        +message?: ?(React.Node | string),
        +cancelable: boolean,
        actions?: Array<CallbackAction>
    }
} | {
    type: typeof NOTIFICATION.CLOSE,
    payload?: {
        id?: string;
        devicePath?: string
    }
}

export const close = (payload: any = {}): Action => ({
    type: NOTIFICATION.CLOSE,
    payload,
});


// called from RouterService
export const clear = (currentParams: RouterLocationState, requestedParams: RouterLocationState): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // if route has been changed from device view into something else (like other device, settings...)
    // try to remove all Notifications which are linked to previous device (they are not cancelable by user)
    if (currentParams.device !== requestedParams.device || currentParams.deviceInstance !== requestedParams.deviceInstance) {
        const entries = getState().notifications.filter(entry => typeof entry.devicePath === 'string');
        entries.forEach((entry) => {
            if (typeof entry.devicePath === 'string') {
                dispatch({
                    type: NOTIFICATION.CLOSE,
                    payload: {
                        devicePath: entry.devicePath,
                    },
                });
            }
        });
    }
};
