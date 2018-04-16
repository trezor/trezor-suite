/* @flow */
'use strict';

import * as LOG from './constants/log';

import type { AsyncAction, GetState, Dispatch } from '../flowtype';

export type LogAction = {
    type: typeof LOG.OPEN,
} | {
    type: typeof LOG.CLOSE,
};

export const toggle = (): AsyncAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        if (!getState().log.opened) {
            window.scrollTo(0, 0);
        }

        dispatch({
            type: getState().log.opened ? LOG.CLOSE : LOG.OPEN
        });
    }
}
