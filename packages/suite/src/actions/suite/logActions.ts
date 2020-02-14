import copy from 'copy-to-clipboard';
import { LogEntry } from '@suite-reducers/logReducer';
import { Action, GetState, Dispatch } from '@suite-types';
import * as notificationActions from '@suite-actions/notificationActions';

import { LOG } from './constants';

export type LogActions = { type: typeof LOG.ADD; payload: LogEntry };

export const add = (type: string, message: any): Action => ({
    type: LOG.ADD,
    payload: {
        time: new Date().getTime(),
        type,
        message,
    },
});

export const copyToClipboard = () => (dispatch: Dispatch, getState: GetState): void => {
    const { entries } = getState().log;
    try {
        const res = copy(JSON.stringify(entries));
        if (res) {
            dispatch(notificationActions.add({ type: 'log-copied' }));
        }
    } catch (err) {
        dispatch(notificationActions.add({ type: 'error', error: 'failed to copy log' }));
    }
};
