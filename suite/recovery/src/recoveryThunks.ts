import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, { PROTO, type RecoveryDevice } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { isRecoveryInProgress } from './isRecoveryInProgress';
import { recoveryActions } from './recoveryReducer';
import { selectRecoveryInputType, selectWordsCount } from './recoverySelectors';
import { type RecoveryInputType } from './types';

const DEFAULT_PASSPHRASE_PROTECTION = false;

const actionPrefix = '@suite/recovery';

/**
 * Maps the product-level recovery type to the firmware seed input method.
 * - standard → ScrambledWords: user re-enters the seed word by word on the host
 * - advanced → Matrix: user enters each letter directly on the device via the matrix keypad
 */
const recoveryInputTypeToInputMethod: Record<RecoveryInputType, PROTO.RecoveryDeviceInputMethod> = {
    standard: PROTO.RecoveryDeviceInputMethod.ScrambledWords,
    advanced: PROTO.RecoveryDeviceInputMethod.Matrix,
};

export const checkSeedThunk = createThunk(
    `${actionPrefix}/checkSeedThunk`,
    async (_, { dispatch, getState, extra }) => {
        const recoveryInputType = selectRecoveryInputType(getState());
        const wordsCount = selectWordsCount(getState());
        const device = selectSelectedDevice(getState());

        if (!device?.features) return;

        dispatch(recoveryActions.setError(undefined));

        if (device.features.internal_model === DeviceModelInternal.T1B1) {
            dispatch(recoveryActions.setStatus('waiting-for-confirmation'));
        } else {
            dispatch(recoveryActions.setStatus('in-progress'));
        }

        const response = await TrezorConnect.recoveryDevice({
            type: device.features.recovery_type ?? 'DryRun', // For old firmware, we assume DryRun as it was the only option before
            input_method: recoveryInputTypeToInputMethod[recoveryInputType],
            word_count: wordsCount,
            enforce_wordlist: true,
            device: {
                path: device.path,
            },
        });

        if (!response.success) {
            // A user-initiated cancellation is not a failure: reset the flow instead of leaving the
            // reducer on the 'finished' + error state, which renders the "seed check failed" screen.
            if (response.error.code === 'Method_Cancel') {
                dispatch(recoveryActions.resetReducer());

                return;
            }

            dispatch(recoveryActions.setError(response.error.message));
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.settingsDeviceCheckSeedEvent.name,
                payload: {
                    status: 'error',
                    error: response.error.code,
                },
            });
        } else {
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.settingsDeviceCheckSeedEvent.name,
                payload: {
                    status: 'finished',
                },
            });
        }

        dispatch(recoveryActions.setStatus('finished'));
    },
);

export const recoverDeviceThunk = createThunk(
    `${actionPrefix}/recoverDeviceThunk`,
    async (_, { dispatch, getState }) => {
        const recoveryInputType = selectRecoveryInputType(getState());
        const wordsCount = selectWordsCount(getState());
        const device = selectSelectedDevice(getState());

        if (!device?.features) {
            return;
        }
        dispatch(recoveryActions.setError(undefined));

        if (device.features.internal_model === DeviceModelInternal.T1B1) {
            dispatch(recoveryActions.setStatus('waiting-for-confirmation'));
        } else {
            dispatch(recoveryActions.setStatus('in-progress'));
        }

        const params: RecoveryDevice = {
            type: device.features.recovery_type ?? 'NormalRecovery', // For old firmware, we assume NormalRecovery as it was the only option before
            input_method: recoveryInputTypeToInputMethod[recoveryInputType],
            word_count: wordsCount,
            passphrase_protection: DEFAULT_PASSPHRASE_PROTECTION,
            enforce_wordlist: true,
        };

        if (device.features.capabilities?.includes('Capability_U2F')) {
            params.u2f_counter = Math.floor(Date.now() / 1000);
        }

        const response = await TrezorConnect.recoveryDevice({
            ...params,
            device: {
                path: device.path,
            },
        });

        if (!response.success) {
            // A user-initiated cancellation is not a failure: reset the flow instead of leaving the
            // reducer on the 'finished' + error state, which renders the "recovery failed" screen.
            if (response.error.code === 'Method_Cancel') {
                dispatch(recoveryActions.resetReducer());

                return;
            }

            dispatch(recoveryActions.setError(response.error.message));
        }

        dispatch(recoveryActions.setStatus('finished'));
    },
);

// Recovery mode is persistent on T2T1. This means that device stays in recovery mode even after reconnecting.
// In such case, we need to call again the call that brought device into recovery mode (either proper recovery
// or seed check). This way, communication is renewed and host starts receiving messages from device again.
export const recoveryRerunThunk = createThunk<
    { initialized: boolean | null | undefined },
    void,
    { rejectValue: string }
>(`${actionPrefix}/recoveryRerunThunk`, async (_, { dispatch, getState, rejectWithValue }) => {
    const device = selectSelectedDevice(getState());
    if (!device?.features) {
        return rejectWithValue('no device features');
    }

    dispatch(recoveryActions.setStatus('in-progress'));

    // user might have proceeded with recovery on screen which means that we need to
    // reload fresh features before deciding what to do
    const response = await TrezorConnect.getFeatures({ device: { path: device.path } });

    // If the selected device changed during the getFeatures round-trip (a multi-device switch), bail
    // out before touching shared recovery state on EITHER response branch — otherwise this device's
    // outcome (including a stale 'failed to rerun' error) would be applied to a different device, and
    // the seed-input call the caller starts next would target the wrong device. Reset so the status
    // set above is not left stuck; the newly-selected device re-triggers its own rerun if needed.
    if (selectSelectedDevice(getState())?.path !== device.path) {
        dispatch(recoveryActions.resetReducer());

        return rejectWithValue('selected device changed');
    }

    if (!response.success) {
        dispatch(recoveryActions.setStatus('finished'));
        dispatch(recoveryActions.setError('failed to rerun recovery'));

        return rejectWithValue('failed to rerun recovery');
    }

    const features = response.payload;

    if (!isRecoveryInProgress(features)) {
        // Device already left recovery mode; clear the transient 'in-progress' status set above so
        // the recovery-detection guard and the recovery-mode banner CTA don't get stuck.
        dispatch(recoveryActions.resetReducer());

        return rejectWithValue('recovery not in progress');
    }

    // The seed-input flow (recoverDeviceThunk / checkSeedThunk) is intentionally NOT started here.
    // The caller starts it AFTER navigating to the recovery/onboarding view. Starting it here would
    // race the routerAppChanged -> resetReducer that the navigation triggers, wiping the freshly-set
    // 'in-progress' status back to 'initial' (wrong "Start" screen) while the device call is in flight.
    return { initialized: features.initialized };
});
