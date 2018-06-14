/* @flow */
'use strict';

const PREFIX: string = 'method';
export const TAB_CHANGE: string = `${PREFIX}_tab_change`;
export const UPDATE_CODE: string = `${PREFIX}_update_code`;
export const RESPONSE: string = `${PREFIX}_response`;

export const onTabChange = (tab) => {
    return {
        type: TAB_CHANGE,
        tab
    }
}

export const updateCode = () => {
    return (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const state = getState();
        let key = state.router.location.pathname.replace('/', '').replace('-', '');
        if (key === '') {
            key = 'getxpub';
        }

        if (state.hasOwnProperty(key)) {
            const reducer = state[key];
            if (reducer.fields) {
                const params = {};
                reducer.fields.forEach(field => {
                    console.log("get field", field, reducer[field])
                    params[field] = reducer[field];
                });

                dispatch({
                    type: UPDATE_CODE,
                    params,
                    code: `${reducer.js}(${ JSON.stringify(params, undefined, 2) })`
                })
            }
        }
    }
}

export const onResponse = (response: Object) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        dispatch({
            type: RESPONSE,
            response
        });
    }
}