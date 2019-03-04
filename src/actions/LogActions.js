/* @flow */

import * as LOG from 'actions/constants/log';
import copy from 'copy-to-clipboard';

import type {
    Action, ThunkAction, GetState, Dispatch,
} from 'flowtype';
import type { LogEntry } from 'reducers/LogReducer';

export type LogAction = {
    type: typeof LOG.OPEN,
} | {
    type: typeof LOG.CLOSE,
} | {
    type: typeof LOG.COPY_RESET,
} | {
    type: typeof LOG.COPY_SUCCESS,
} | {
    type: typeof LOG.ADD,
    payload: LogEntry
};

export const toggle = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    if (!getState().log.opened) {
        window.scrollTo(0, 0);

        dispatch({
            type: LOG.OPEN,
        });
    } else {
        dispatch({
            type: LOG.CLOSE,
        });
    }
};

export const add = (type: string, message: any): Action => ({
    type: LOG.ADD,
    payload: {
        time: new Date().getTime(),
        type,
        message,
    },
});

export const copyToClipboard = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const { entries } = getState().log;
    try {
        const res = copy(JSON.stringify(entries));
        if (res) {
            dispatch({
                type: LOG.COPY_SUCCESS,
            });
        }
    } catch (err) {
        console.error(err);
    }
};

export const resetCopyState = (): Action => ({
    type: LOG.COPY_RESET,
});
