import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, { PROTO, type RecoveryDevice } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { isRecoveryInProgress } from './isRecoveryInProgress';
import { type RecoveryState, recoveryActions } from './recoveryReducer';
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

type CheckSeedThunkDeps = { services: DesktopAnalyticsDep };
type CheckSeedThunkState = DeviceRootState & { recovery: RecoveryState };

export const checkSeedThunk = createThunk<
    void,
    void,
    { state: CheckSeedThunkState; extra: CheckSeedThunkDeps }
>(`${actionPrefix}/checkSeedThunk`, async (_, { dispatch, getState, extra }) => {
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
        dispatch(recoveryActions.setError(response.error.message));
        extra.services.analytics.report({
            type: events.settingsDeviceCheckSeedEvent.name,
            payload: {
                status: 'error',
                error: response.error.code,
            },
        });
    } else {
        extra.services.analytics.report({
            type: events.settingsDeviceCheckSeedEvent.name,
            payload: {
                status: 'finished',
            },
        });
    }

    dispatch(recoveryActions.setStatus('finished'));
});

type RecoverDeviceThunkState = DeviceRootState & { recovery: RecoveryState };

export const recoverDeviceThunk = createThunk<void, void, { state: RecoverDeviceThunkState }>(
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
            dispatch(recoveryActions.setError(response.error.message));
        }

        dispatch(recoveryActions.setStatus('finished'));
    },
);

type RecoveryRerunThunkDeps = { services: DesktopAnalyticsDep };
type RecoveryRerunThunkState = DeviceRootState & { recovery: RecoveryState };

// Recovery mode is persistent on T2T1. This means that device stays in recovery mode even after reconnecting.
// In such case, we need to call again the call that brought device into recovery mode (either proper recovery
// or seed check). This way, communication is renewed and host starts receiving messages from device again.
export const recoveryRerunThunk = createThunk<
    { initialized: boolean | null | undefined },
    void,
    { rejectValue: string; state: RecoveryRerunThunkState; extra: RecoveryRerunThunkDeps }
>(`${actionPrefix}/recoveryRerunThunk`, async (_, { dispatch, getState, rejectWithValue }) => {
    const device = selectSelectedDevice(getState());
    if (!device?.features) {
        return rejectWithValue('no device features');
    }

    dispatch(recoveryActions.setStatus('in-progress'));

    // user might have proceeded with recovery on screen which means that we need to
    // reload fresh features before deciding what to do
    const response = await TrezorConnect.getFeatures({ device: { path: device.path } });

    if (!response.success) {
        dispatch(recoveryActions.setStatus('finished'));
        dispatch(recoveryActions.setError('failed to rerun recovery'));

        return rejectWithValue('failed to rerun recovery');
    }

    const features = response.payload;

    if (!isRecoveryInProgress(features)) {
        return rejectWithValue('recovery not in progress');
    }

    if (!features.initialized) {
        dispatch(recoverDeviceThunk());
    }

    if (features.initialized) {
        dispatch(checkSeedThunk());
    }

    return { initialized: features.initialized };
});
