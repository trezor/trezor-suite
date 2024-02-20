import { deviceActions, selectDevice } from '@suite-common/wallet-core';
import TrezorConnect, { UI, RecoveryDevice, DeviceModelInternal } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';

import { RECOVERY } from 'src/actions/recovery/constants';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { Dispatch, GetState } from 'src/types/suite';
import { WordCount } from 'src/types/recovery';
import { DEFAULT_PASSPHRASE_PROTECTION } from 'src/constants/suite/device';

export type SeedInputStatus =
    | 'initial'
    | 'select-word-count'
    | 'select-recovery-type'
    | 'waiting-for-confirmation'
    | 'in-progress'
    | 'finished';

export type RecoveryAction =
    | { type: typeof RECOVERY.SET_WORDS_COUNT; payload: WordCount }
    | { type: typeof RECOVERY.SET_ADVANCED_RECOVERY; payload: boolean }
    | { type: typeof RECOVERY.SET_ERROR; payload: string }
    | { type: typeof RECOVERY.SET_STATUS; payload: SeedInputStatus }
    | { type: typeof RECOVERY.RESET_REDUCER };

const setWordsCount = (count: WordCount): RecoveryAction => ({
    type: RECOVERY.SET_WORDS_COUNT,
    payload: count,
});

const setAdvancedRecovery = (value: boolean): RecoveryAction => ({
    type: RECOVERY.SET_ADVANCED_RECOVERY,
    payload: value,
});

const setError = (payload: string): RecoveryAction => ({
    type: RECOVERY.SET_ERROR,
    payload,
});

const resetReducer = (): RecoveryAction => ({
    type: RECOVERY.RESET_REDUCER,
});

const setStatus = (status: SeedInputStatus): RecoveryAction => ({
    type: RECOVERY.SET_STATUS,
    payload: status,
});

const submit = (word: string) => () => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: word });
};

const checkSeed = () => async (dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery, wordsCount } = getState().recovery;
    const device = selectDevice(getState());

    if (!device?.features) return;

    dispatch(setError(''));

    if (device.features.internal_model === DeviceModelInternal.T1B1) {
        dispatch(setStatus('waiting-for-confirmation'));
    } else {
        dispatch(setStatus('in-progress'));
    }

    const response = await TrezorConnect.recoveryDevice({
        dry_run: true,
        type: advancedRecovery ? 1 : 0,
        word_count: wordsCount,
        enforce_wordlist: true,
        device: {
            path: device.path,
        },
    });

    if (!response.success) {
        dispatch(setError(response.payload.error));
        analytics.report({
            type: EventType.SettingsDeviceCheckSeed,
            status: 'error',
            error: response.payload.code,
        });
    } else {
        analytics.report({ type: EventType.SettingsDeviceCheckSeed, status: 'finished' });
    }

    dispatch(setStatus('finished'));
};

const recoverDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery, wordsCount } = getState().recovery;
    const device = selectDevice(getState());
    if (!device?.features) {
        return;
    }
    dispatch(setError(''));

    if (device.features.internal_model === DeviceModelInternal.T1B1) {
        dispatch(setStatus('waiting-for-confirmation'));
    } else {
        dispatch(setStatus('in-progress'));
    }

    const params: RecoveryDevice = {
        type: advancedRecovery ? 1 : 0,
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

    if (response.success && DEFAULT_PASSPHRASE_PROTECTION) {
        // We call recoverDevice from onboarding
        // Uninitialized device has disabled passphrase protection thus useEmptyPassphrase is set to true.
        // It means that when user finished the onboarding process a standard wallet is automatically
        // discovered instead of asking for selecting between standard wallet and a passphrase.
        // This action takes cares of setting useEmptyPassphrase to false (handled by deviceReducer).
        dispatch(deviceActions.updatePassphraseMode({ device, hidden: true }));
    }

    if (!response.success) {
        dispatch(setError(response.payload.error));
    }

    dispatch(setStatus('finished'));
};

// Recovery mode is persistent on T2T1. This means that device stays in recovery mode even after reconnecting.
// In such case, we need to call again the call that brought device into recovery mode (either proper recovery
// or seed check). This way, communication is renewed and host starts receiving messages from device again.
const rerun = () => async (dispatch: Dispatch, getState: GetState) => {
    const { router } = getState();
    const device = selectDevice(getState());
    if (!device?.features) {
        return;
    }

    dispatch(setStatus('in-progress'));

    // user might have proceeded with recovery on screen which means that we need to
    // reload fresh features before deciding what to do
    const response = await TrezorConnect.getFeatures({
        device: {
            path: device.path,
        },
    });

    if (!response.success) {
        dispatch(setStatus('finished'));
        dispatch(setError('failed to rerun recovery'));

        return;
    }

    const features = response.payload;

    if (!features.recovery_mode) {
        return;
    }

    if (!features.initialized) {
        if (router.app !== 'onboarding') {
            dispatch(routerActions.goto('onboarding-index'));
        }
        dispatch(onboardingActions.goToStep('recovery'));
        dispatch(onboardingActions.addPath('recovery'));
        dispatch(recoverDevice());
    }

    if (features.initialized) {
        dispatch(routerActions.goto('recovery-index'));
        dispatch(checkSeed());
    }
};

export {
    submit,
    setWordsCount,
    setAdvancedRecovery,
    checkSeed,
    recoverDevice,
    resetReducer,
    setStatus,
    rerun,
};
