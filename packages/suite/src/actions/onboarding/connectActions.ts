/* eslint-disable @typescript-eslint/camelcase */
import TrezorConnect, { UI } from 'trezor-connect';

import {
    DEVICE_CALL_START,
    DEVICE_CALL_ERROR,
    DEVICE_CALL_SUCCESS,
    DEVICE_CALL_RESET,
} from '@suite/types/onboarding/connect';
import { AnyStepId } from '@suite/types/onboarding/steps';
import * as CALLS from '@suite/actions/onboarding/constants/calls';
import { DEFAULT_LABEL } from '@suite/constants/onboarding/trezor';

import { goToNextStep } from './onboardingActions';
import { GetState, Dispatch } from '@suite-types';

const call = (name: string, params?: any) => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    dispatch({ type: DEVICE_CALL_RESET });

    dispatch({
        type: DEVICE_CALL_START,
        name,
    });

    if (device === null) {
        dispatch({
            type: DEVICE_CALL_ERROR,
            error: 'no device connected',
            name,
        });
        return null;
    }

    const callParams = {
        useEmptyPassphrase: true,
        device,
    };
    Object.assign(callParams, params);
    let fn;
    switch (name) {
        case CALLS.FIRMWARE_UPDATE:
            fn = () => TrezorConnect.firmwareUpdate(callParams);
            break;
        case CALLS.RESET_DEVICE:
            fn = () => TrezorConnect.resetDevice(callParams);
            break;
        case CALLS.BACKUP_DEVICE:
            // @ts-ignore
            fn = () => TrezorConnect.backupDevice(callParams);
            break;
        case CALLS.APPLY_SETTINGS:
            fn = () => TrezorConnect.applySettings(callParams);
            break;
        case CALLS.APPLY_FLAGS:
            // @ts-ignore
            fn = () => TrezorConnect.applyFlags(callParams);
            break;
        case CALLS.GET_FEATURES:
            fn = () => TrezorConnect.getFeatures(callParams);
            break;
        case CALLS.CHANGE_PIN:
            fn = () => TrezorConnect.changePin(callParams);
            break;
        case CALLS.RECOVER_DEVICE:
            // @ts-ignore
            fn = () => TrezorConnect.recoveryDevice(callParams);
            break;
        case CALLS.WIPE_DEVICE:
            fn = () => TrezorConnect.wipeDevice(callParams);
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
        // @ts-ignore
        case UI.RECEIVE_PIN:
            // @ts-ignore
            fn = () => TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: params.pin });
            break;
        // @ts-ignore
        case UI.RECEIVE_WORD:
            fn = () =>
                // @ts-ignore
                TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: params.word });
            break;
        default:
            // todo: handle error properly
            throw new Error(`call ${name} does not exist`);
    }
    await fn();
};

const getFeatures = () => (dispatch: Dispatch) => dispatch(call(CALLS.GET_FEATURES));

const firmwareUpdate = (params: any) => (dispatch: Dispatch) =>
    dispatch(call(CALLS.FIRMWARE_UPDATE, params));

const resetDevice = (params?: any) => (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (device!.features!.major_version === 1) {
        return dispatch(
            call(CALLS.RESET_DEVICE, {
                ...params,
                label: DEFAULT_LABEL,
                skipBackup: true,
                passhpraseProtection: true,
            }),
        );
    }
    return dispatch(
        call(CALLS.RESET_DEVICE, {
            ...params,
            strength: 128,
            label: DEFAULT_LABEL,
            skipBackup: true,
            passhpraseProtection: true,
        }),
    );
};

const backupDevice = () => (dispatch: Dispatch) => dispatch(call(CALLS.BACKUP_DEVICE));

const applySettings = (params: any) => (dispatch: Dispatch) =>
    dispatch(call(CALLS.APPLY_SETTINGS, params));

const applyFlags = (params: any) => (dispatch: Dispatch) =>
    dispatch(call(CALLS.APPLY_FLAGS, params));

const changePin = () => (dispatch: Dispatch) => dispatch(call(CALLS.CHANGE_PIN));

const recoveryDevice = () => (dispatch: Dispatch, getState: GetState) => {
    let defaults;
    const { device } = getState().suite;
    const { recovery } = getState().onboarding;
    if (device!.features!.major_version === 2) {
        defaults = {
            passphrase_protection: true,
        };
    } else {
        defaults = {
            passphrase_protection: true,
            type: recovery.advancedRecovery ? 1 : 0,
            word_count: recovery.wordsCount,
        };
    }

    return dispatch(call(CALLS.RECOVER_DEVICE, { ...defaults }));
};
const wipeDevice = () => (dispatch: Dispatch) => dispatch(call(CALLS.WIPE_DEVICE));
const submitNewPin = (params: any) => (dispatch: Dispatch) =>
    // @ts-ignore
    dispatch(uiResponseCall(UI.RECEIVE_PIN, params));
const submitWord = (params: any) => (dispatch: Dispatch) =>
    // @ts-ignore
    dispatch(uiResponseCall(UI.RECEIVE_WORD, params));

const callActionAndGoToNextStep = (
    action: any,
    stepId?: AnyStepId,
    goOnSuccess: boolean = true,
    goOnError: boolean = false,
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
    firmwareUpdate,
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
