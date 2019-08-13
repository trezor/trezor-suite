import TrezorConnect, { Device, DEVICE } from 'trezor-connect';
import { DEVICE_SETTINGS } from './constants';
import { Action, Dispatch, GetState, TrezorDevice } from '@suite-types';

export type SuiteActions =
    | { type: typeof DEVICE_SETTINGS.APPLY_SETTINGS }
    | { type: typeof DEVICE_SETTINGS.CHANGE_PIN }

    // @ts-ignore
export const applySettings = params => async () => {
    // @ts-ignore
    TrezorConnect.applySettings(params);
};

// @ts-ignore
export const changePin = params => async () => {
    // @ts-ignore
    TrezorConnect.changePin(params);
};
