/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'resetdevice';
export const FLAG_CHANGE: string = `${PREFIX}_flag_@change`;

export function onFlagChange(id: string, value: string): any {
    const flag = {}
    flag[id] = value;
    return {
        type: FLAG_CHANGE,
        flag,
    }
}

export function onResetDevice(): any {
    return async function (dispatch, getState) {

        const state = getState().resetdevice;
        const params = {};
        if (state.label !== '') {
            params.label = state.label;
        }
        if (state.pinProtection) {
            params.pinProtection = state.pinProtection;
        }
        if (state.passphraseProtection) {
            params.passphraseProtection = state.passphraseProtection;
        }
        if (state.skipBackup) {
            params.skipBackup = state.skipBackup;
        }
        if (state.noBackup) {
            params.noBackup = state.noBackup;
        }

        const response = await TrezorConnect.resetDevice(params);

        dispatch( onResponse(response) );
    }
}

export function onWipeDevice(): any {
    return async function (dispatch, getState) {

        const response = await TrezorConnect.wipeDevice({
            noBackup: true
        });

        dispatch( onResponse(response) );
    }
}

