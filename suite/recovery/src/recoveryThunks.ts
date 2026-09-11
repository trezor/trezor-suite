import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
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

export type RecoveryForDeviceThunkParams = {
    /**
     * The device to run recovery against. Named by the caller so the flow stays on one physical
     * device: recovery makes the device reboot, and the global selection moves while it is away.
     */
    device: TrezorDevice | undefined;
};

type CheckSeedForDeviceThunkState = DeviceRootState & { recovery: RecoveryState };

type CheckSeedForDeviceThunkDeps = WithServices<DesktopAnalyticsDep>;

export const checkSeedForDeviceThunk = createThunk<
    void,
    RecoveryForDeviceThunkParams,
    { state: CheckSeedForDeviceThunkState; extra: CheckSeedForDeviceThunkDeps }
>(`${actionPrefix}/checkSeedForDeviceThunk`, async ({ device }, { dispatch, getState, extra }) => {
    const recoveryInputType = selectRecoveryInputType(getState());
    const wordsCount = selectWordsCount(getState());

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

type RecoverForDeviceThunkState = DeviceRootState & { recovery: RecoveryState };

export const recoverForDeviceThunk = createThunk<
    void,
    RecoveryForDeviceThunkParams,
    { state: RecoverForDeviceThunkState }
>(`${actionPrefix}/recoverForDeviceThunk`, async ({ device }, { dispatch, getState }) => {
    const recoveryInputType = selectRecoveryInputType(getState());
    const wordsCount = selectWordsCount(getState());

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
});

type RecoveryRerunForDeviceThunkState = DeviceRootState & { recovery: RecoveryState };

type RecoveryRerunForDeviceThunkDeps = WithServices<DesktopAnalyticsDep>;

// Recovery mode is persistent on T2T1. This means that device stays in recovery mode even after reconnecting.
// In such case, we need to call again the call that brought device into recovery mode (either proper recovery
// or seed check). This way, communication is renewed and host starts receiving messages from device again.
export const recoveryRerunForDeviceThunk = createThunk<
    { initialized: boolean | null | undefined },
    RecoveryForDeviceThunkParams,
    {
        rejectValue: string;
        state: RecoveryRerunForDeviceThunkState;
        extra: RecoveryRerunForDeviceThunkDeps;
    }
>(
    `${actionPrefix}/recoveryRerunForDeviceThunk`,
    async ({ device }, { dispatch, rejectWithValue }) => {
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
            dispatch(recoverForDeviceThunk({ device }));
        }

        if (features.initialized) {
            dispatch(checkSeedForDeviceThunk({ device }));
        }

        return { initialized: features.initialized };
    },
);

/**
 * Wrappers for callers that still work with whatever device is selected. They resolve the device
 * once, here, and hand it to the implementation above — so nothing below this line re-reads the
 * selection mid-flow.
 */
type CheckSeedThunkState = CheckSeedForDeviceThunkState;

type CheckSeedThunkDeps = CheckSeedForDeviceThunkDeps;

export const checkSeedThunk = createThunk<
    void,
    void,
    { state: CheckSeedThunkState; extra: CheckSeedThunkDeps }
>(`${actionPrefix}/checkSeedThunk`, (_, { dispatch, getState }) => {
    dispatch(checkSeedForDeviceThunk({ device: selectSelectedDevice(getState()) }));
});

type RecoverDeviceThunkState = RecoverForDeviceThunkState;

export const recoverDeviceThunk = createThunk<void, void, { state: RecoverDeviceThunkState }>(
    `${actionPrefix}/recoverDeviceThunk`,
    (_, { dispatch, getState }) => {
        dispatch(recoverForDeviceThunk({ device: selectSelectedDevice(getState()) }));
    },
);

type RecoveryRerunThunkState = RecoveryRerunForDeviceThunkState;

type RecoveryRerunThunkDeps = RecoveryRerunForDeviceThunkDeps;

export const recoveryRerunThunk = createThunk<
    { initialized: boolean | null | undefined },
    void,
    { rejectValue: string; state: RecoveryRerunThunkState; extra: RecoveryRerunThunkDeps }
>(`${actionPrefix}/recoveryRerunThunk`, (_, { dispatch, getState }) =>
    dispatch(recoveryRerunForDeviceThunk({ device: selectSelectedDevice(getState()) })).unwrap(),
);
