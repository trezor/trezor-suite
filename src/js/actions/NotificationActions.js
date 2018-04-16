/* @flow */
'use strict';

import * as NOTIFICATION from './constants/notification';

import type { AsyncAction, GetState, Dispatch, RouterLocationState } from '../flowtype';

export type NotificationAction = {
    type: typeof NOTIFICATION.ADD,
    payload: {
        +type: string,
        +title: string,
        +message?: string,
        +cancelable: boolean,
        actions?: Array<any>
    }
} | {
    type: typeof NOTIFICATION.CLOSE,
    payload?: {
        id?: string;
        devicePath?: string
    }
}

export const close = () => {
    
}


// called from RouterService
export const clear = (currentParams: RouterLocationState, requestedParams: RouterLocationState): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // if route has been changed from device view into something else (like other device, settings...) 
        // try to remove all Notifications which are linked to previous device (they are not cancelable by user)
        if (currentParams.device !== requestedParams.device || currentParams.deviceInstance !== requestedParams.deviceInstance) {
            const entries = getState().notifications.filter(entry => typeof entry.devicePath === 'string');
            entries.forEach(entry => {
                dispatch({
                    type: NOTIFICATION.CLOSE,
                    payload: {
                        devicePath: entry.devicePath
                    }
                })
            });
        }
    }
}
