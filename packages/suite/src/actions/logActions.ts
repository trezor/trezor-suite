import copy from 'copy-to-clipboard';
import { Action, GetState, Dispatch } from '@suite/types';
import { LogEntry } from '@suite/reducers/common/logReducer';
import * as LOG from './constants/log';

export type LogActions =
    | {
          type: typeof LOG.OPEN;
      }
    | {
          type: typeof LOG.CLOSE;
      }
    | {
          type: typeof LOG.COPY_RESET;
      }
    | {
          type: typeof LOG.COPY_SUCCESS;
      }
    | {
          type: typeof LOG.ADD;
          payload: LogEntry;
      };

export const toggle = () => (dispatch: Dispatch, getState: GetState) => {
    if (!getState().log.opened) {
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

export const copyToClipboard = () => (dispatch: Dispatch, getState: GetState): void => {
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

export const resetCopyState = () => ({
    type: LOG.COPY_RESET,
});
