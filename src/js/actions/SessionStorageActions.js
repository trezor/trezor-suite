/* @flow */


import type { State as SendFormState } from '../reducers/SendFormReducer';
import type {
    ThunkAction,
    GetState,
    Dispatch,
} from '~/flowtype';

const PREFIX: string = 'trezor:draft-tx:';

export const save = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    if (typeof window.localStorage === 'undefined') return;

    const location = getState().router.location.pathname;
    const state = getState().sendForm;
    if (!state.untouched) {
        try {
            window.sessionStorage.setItem(`${PREFIX}${location}`, JSON.stringify(state));
        } catch (error) {
            console.error(`Saving sessionStorage error: ${error}`);
        }
    }
};

export const load = (location: string): ?SendFormState => {
    if (typeof window.localStorage === 'undefined') return;

    try {
        const value: string = window.sessionStorage.getItem(`${PREFIX}${location}`);
        const state: ?SendFormState = JSON.parse(value);
        if (state && state.address === '' && (state.amount === '' || state.amount === '0')) {
            window.sessionStorage.removeItem(`${PREFIX}${location}`);
            return;
        }
        return state;
    } catch (error) {
        console.error(`Loading sessionStorage error: ${error}`);
    }
};

export const clear = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    if (typeof window.localStorage === 'undefined') return;
    const location = getState().router.location.pathname;
    try {
        window.sessionStorage.removeItem(`${PREFIX}${location}`);
    } catch (error) {
        console.error(`Clearing sessionStorage error: ${error}`);
    }
};