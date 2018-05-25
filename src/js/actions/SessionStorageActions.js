/* @flow */
'use strict';

import type { State as SendFormState } from '../reducers/SendFormReducer';

const PREFIX: string = 'trezor:draft-tx:';

export const save = (location: string, state: SendFormState): void => {

    if (typeof window.localStorage === 'undefined') return;

    if (!state.untouched) {
        try {
            window.sessionStorage.setItem(`${PREFIX}${location}`, JSON.stringify(state) );
        } catch (error) {
            console.error("Saving sessionStorage error: " + error)
        }
    }
}

export const load = (location: string): ?SendFormState => {

    if (typeof window.localStorage === 'undefined') return;

    try {
        const value: string = window.sessionStorage.getItem(`${PREFIX}${location}`);
        return JSON.parse(value);
    } catch (error) {
        console.error("Loading sessionStorage error: " + error)
    }

    return;
}

export const clear = (location: string) => {
    if (typeof window.localStorage === 'undefined') return;

    try {
        window.sessionStorage.removeItem(`${PREFIX}${location}`);
    } catch (error) {
        console.error("Clearing sessionStorage error: " + error)
    }
}