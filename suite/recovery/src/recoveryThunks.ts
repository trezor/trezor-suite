import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, { PROTO, type RecoveryDevice, UI_RESPONSE } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { isRecoveryInProgress } from './isRecoveryInProgress';
import { recoveryActions } from './recoveryReducer';
import { selectAdvancedRecovery, selectWordsCount } from './recoverySelectors';

const DEFAULT_PASSPHRASE_PROTECTION = false;

const actionPrefix = '@suite/recovery';

export const submitThunk = createThunk(
    `${actionPrefix}/submitThunk`,
    ({ word }: { word: string }) => {
        TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_WORD, payload: word });
    },
);

export const checkSeedThunk = createThunk(
    `${actionPrefix}/checkSeedThunk`,
    async (_, { dispatch, getState, extra }) => {
        const advancedRecovery = selectAdvancedRecovery(getState());
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
            input_method: advancedRecovery
                ? PROTO.RecoveryDeviceInputMethod.Matrix
                : PROTO.RecoveryDeviceInputMethod.ScrambledWords,
            word_count: wordsCount,
            enforce_wordlist: true,
            device: {
                path: device.path,
            },
        });

        if (!response.success) {
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
        const advancedRecovery = selectAdvancedRecovery(getState());
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
            input_method: advancedRecovery
                ? PROTO.RecoveryDeviceInputMethod.Matrix
                : PROTO.RecoveryDeviceInputMethod.ScrambledWords,
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

// Recovery mode is persistent on T2T1. This means that device stays in recovery mode even after reconnecting.
// In such case, we need to call again the call that brought device into recovery mode (either proper recovery
// or seed check). This way, communication is renewed and host starts receiving messages from device again.
export const recoveryRerunThunk = createThunk<
    { initialized: boolean | null },
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
