/* @flow */


import type { State as SendFormState } from 'reducers/SendFormReducer';
import type {
    ThunkAction,
    PayloadAction,
    GetState,
    Dispatch,
} from 'flowtype';

const TX_PREFIX: string = 'trezor:draft-tx:';

export const saveDraftTransaction = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    if (typeof window.localStorage === 'undefined') return;

    const state = getState().sendForm;
    if (state.untouched) return;

    const location = getState().router.location.pathname;
    try {
        // save state as it is
        // "loadDraftTransaction" will do the validation
        window.sessionStorage.setItem(`${TX_PREFIX}${location}`, JSON.stringify(state));
    } catch (error) {
        console.error(`Saving sessionStorage error: ${error}`);
    }
};

export const loadDraftTransaction = (): PayloadAction<?SendFormState> => (dispatch: Dispatch, getState: GetState): ?SendFormState => {
    if (typeof window.localStorage === 'undefined') return null;

    try {
        const location = getState().router.location.pathname;
        const value: string = window.sessionStorage.getItem(`${TX_PREFIX}${location}`);
        const state: ?SendFormState = JSON.parse(value);
        if (state) {
            // decide if draft is valid and should be returned
            // ignore this draft if has any error
            if (Object.keys(state.errors).length > 0) {
                window.sessionStorage.removeItem(`${TX_PREFIX}${location}`);
                return null;
            }
            return state;
        }
    } catch (error) {
        console.error(`Loading sessionStorage error: ${error}`);
    }
    return null;
};

export const clear = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    if (typeof window.localStorage === 'undefined') return;
    const location = getState().router.location.pathname;
    try {
        window.sessionStorage.removeItem(`${TX_PREFIX}${location}`);
    } catch (error) {
        console.error(`Clearing sessionStorage error: ${error}`);
    }
};