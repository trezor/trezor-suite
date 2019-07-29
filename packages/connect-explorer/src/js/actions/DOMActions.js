/* @flow */
'use strict';

export const ON_RESIZE: string = 'ON_RESIZE';

export const onResize = (): void => {
    return {
        type: ON_RESIZE
    }
}

export const onBeforeUnload = (): void => {
    return async function (dispatch, getState) {
        
    }
}
