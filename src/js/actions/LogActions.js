/* @flow */
'use strict';

export const toggle = (): any => {
    return (dispatch, getState) => {

        if (!getState().log.opened) {
            window.scrollTo(0, 0);
        }

        dispatch({
            type: getState().log.opened ? 'log__close' : 'log__open'
        });
    }
}
