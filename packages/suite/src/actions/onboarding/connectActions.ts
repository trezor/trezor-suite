// TODO: deprecated, should be refactored and removed

/* eslint-disable @typescript-eslint/camelcase */
import TrezorConnect, {
    UI,
    ApplyFlagsParams,
    ApplySettingsParams,
    ResetDeviceParams,
} from 'trezor-connect';

import {
    DEVICE_CALL_START,
    DEVICE_CALL_ERROR,
    DEVICE_CALL_SUCCESS,
    DEVICE_CALL_RESET,
} from '@onboarding-types/connect';
import { AnyStepId } from '@onboarding-types/steps';
import * as CALLS from '@onboarding-actions/constants/calls';
import { ObjectValues } from '@suite/types/utils';
import { goToNextStep } from './onboardingActions';
import { GetState, Dispatch, AppState } from '@suite-types';

const DEFAULT_LABEL = 'My Trezor';
const DEFAULT_PASSPHRASE_PROTECTION = true;
const DEFAULT_SKIP_BACKUP = true;
const DEFAULT_STRENGTH_T1 = 256;
const DEFAULT_STRENGTH_T2 = 128;

const applyDefaultParams = (state: AppState, call: ObjectValues<typeof CALLS>) => {
    const { device } = state.suite;
    const { backupType } = state.onboarding;

    if (call === CALLS.GET_FEATURES) {
        return {};
    }
    if (!device || !device.features) {
        throw new Error('no device');
    }
    let params;
    switch (call) {
        case CALLS.RESET_DEVICE:
            if (device.features.major_version === 1) {
                params = {
                    strength: DEFAULT_STRENGTH_T1,
                    label: DEFAULT_LABEL,
                    skipBackup: DEFAULT_SKIP_BACKUP,
                    passhpraseProtection: DEFAULT_PASSPHRASE_PROTECTION,
                    backupType: 0,
                };
            } else {
                params = {
                    strength: DEFAULT_STRENGTH_T2,
                    label: DEFAULT_LABEL,
                    skipBackup: DEFAULT_SKIP_BACKUP,
                    passhpraseProtection: DEFAULT_PASSPHRASE_PROTECTION,
                    backupType,
                };
            }
            break;
        // no default
    }

    return {
        ...params,
        // not neccessary
        useEmptyPassphrase: true,
        device,
    };
};

const call = async (
    dispatch: Dispatch,
    state: AppState,
    name: ObjectValues<typeof CALLS>,
    params?: any,
) => {
    // todo: reset and start in separate calls?
    dispatch({ type: DEVICE_CALL_RESET });

    const { device } = state.suite;

    if (!device) {
        // this should never happen
        dispatch({
            type: DEVICE_CALL_ERROR,
            error: 'no device connected',
            name,
        });
        return { success: false };
    }
    // todo: maybe UI lock? hmm but...
    dispatch({
        type: DEVICE_CALL_START,
        name,
    });

    const modifiedParams = {
        ...applyDefaultParams(state, name),
        ...params,
    };

    let fn;
    switch (name) {
        case CALLS.RESET_DEVICE:
            fn = () => TrezorConnect.resetDevice(modifiedParams);
            break;
        case CALLS.BACKUP_DEVICE:
            fn = () => TrezorConnect.backupDevice(modifiedParams);
            break;
        case CALLS.APPLY_SETTINGS:
            fn = () => TrezorConnect.applySettings(modifiedParams);
            break;
        case CALLS.APPLY_FLAGS:
            fn = () => TrezorConnect.applyFlags(modifiedParams);
            break;
        case CALLS.GET_FEATURES:
            fn = () => TrezorConnect.getFeatures(modifiedParams);
            break;
        case CALLS.CHANGE_PIN:
            fn = () => TrezorConnect.changePin(modifiedParams);
            break;
        case CALLS.RECOVER_DEVICE:
            fn = () => TrezorConnect.recoveryDevice(modifiedParams);
            break;
        case CALLS.WIPE_DEVICE:
            fn = () => TrezorConnect.wipeDevice(modifiedParams);
            break;
        default:
            throw new Error(`call ${name} does not exist`);
    }
    const response = await fn();
    if (response.success) {
        dispatch({
            type: DEVICE_CALL_SUCCESS,
            result: response.payload,
            name,
        });
        return response;
    }
    dispatch({
        type: DEVICE_CALL_ERROR,
        error: response.payload.error,
        name,
    });
    return response;
};

const uiResponseCall = (name: string, params: any) => async () => {
    let fn;
    switch (name) {
        case UI.RECEIVE_PIN:
            fn = () => TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: params.pin });
            break;
        case UI.RECEIVE_WORD:
            fn = () => TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: params.word });
            break;
        default:
            // todo: handle error properly
            throw new Error(`call ${name} does not exist`);
    }
    await fn();
};

const getFeatures = () => (dispatch: Dispatch, getState: GetState) =>
    call(dispatch, getState(), CALLS.GET_FEATURES);

const resetDevice = (params?: ResetDeviceParams) => (dispatch: Dispatch, getState: GetState) =>
    call(dispatch, getState(), CALLS.RESET_DEVICE, params);

const backupDevice = () => (dispatch: Dispatch, getState: GetState) =>
    call(dispatch, getState(), CALLS.BACKUP_DEVICE);

const applySettings = (params: ApplySettingsParams) => (dispatch: Dispatch, getState: GetState) =>
    call(dispatch, getState(), CALLS.APPLY_SETTINGS, params);

const applyFlags = (params: ApplyFlagsParams) => (dispatch: Dispatch, getState: GetState) =>
    call(dispatch, getState(), CALLS.APPLY_FLAGS, params);

const changePin = () => (dispatch: Dispatch, getState: GetState) =>
    call(dispatch, getState(), CALLS.CHANGE_PIN);

const recoveryDevice = () => (dispatch: Dispatch, getState: GetState) => {
    return call(dispatch, getState(), CALLS.RECOVER_DEVICE);
};
const wipeDevice = () => (dispatch: Dispatch, getState: GetState) =>
    call(dispatch, getState(), CALLS.WIPE_DEVICE);

const submitNewPin = (params: any) => (dispatch: Dispatch) =>
    dispatch(uiResponseCall(UI.RECEIVE_PIN, params));

const submitWord = (params: any) => (dispatch: Dispatch) =>
    dispatch(uiResponseCall(UI.RECEIVE_WORD, params));

const callActionAndGoToNextStep = (
    action: any,
    stepId?: AnyStepId,
    goOnSuccess = true,
    goOnError = false,
) => (dispatch: Dispatch) => {
    dispatch(action).then((response: any) => {
        if (response.success && goOnSuccess) {
            dispatch(goToNextStep(stepId));
        }
        if (!response.success && goOnError) {
            dispatch(goToNextStep(stepId));
        }
    });
};

// todo: maybe connect this with getFeatures call and use it as "initialize" in terms of connect?
const resetCall = () => ({ type: DEVICE_CALL_RESET });

export {
    // calls to connect
    resetCall,
    getFeatures,
    resetDevice,
    backupDevice,
    applySettings,
    applyFlags,
    changePin,
    recoveryDevice,
    wipeDevice,
    // customizable call
    callActionAndGoToNextStep,
    // responses to device events
    submitNewPin,
    submitWord,
};
