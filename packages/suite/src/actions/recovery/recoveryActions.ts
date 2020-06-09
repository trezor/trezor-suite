/* eslint-disable @typescript-eslint/camelcase */
import TrezorConnect, { UI } from 'trezor-connect';
import { RECOVERY } from '@recovery-actions/constants';

import { Dispatch, GetState, Action } from '@suite-types';
import { WordCount } from '@recovery-types';
import { DEVICE } from '@suite-constants';

export type SeedInputStatus =
    | 'initial'
    | 'select-word-count'
    | 'select-recovery-type'
    | 'in-progress'
    | 'finished';

export type RecoveryActions =
    | { type: typeof RECOVERY.SET_WORDS_COUNT; payload: WordCount }
    | { type: typeof RECOVERY.SET_ADVANCED_RECOVERY; payload: boolean }
    | { type: typeof RECOVERY.SET_ERROR; payload: string }
    | { type: typeof RECOVERY.SET_STATUS; payload: SeedInputStatus }
    | { type: typeof RECOVERY.RESET_REDUCER };

const setWordsCount = (count: WordCount) => ({
    type: RECOVERY.SET_WORDS_COUNT,
    payload: count,
});

const setAdvancedRecovery = (value: boolean) => ({
    type: RECOVERY.SET_ADVANCED_RECOVERY,
    payload: value,
});

const setError = (payload: string): Action => ({
    type: RECOVERY.SET_ERROR,
    payload,
});

const resetReducer = (): Action => ({
    type: RECOVERY.RESET_REDUCER,
});

const setStatus = (status: SeedInputStatus): Action => ({
    type: RECOVERY.SET_STATUS,
    payload: status,
});

const submit = (word: string) => async () => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: word });
};

const checkSeed = () => async (dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery, wordsCount } = getState().recovery;
    const { device } = getState().suite;
    if (!device || !device.features) return;
    dispatch(setError(''));
    dispatch(setStatus('in-progress'));

    const response = await TrezorConnect.recoveryDevice({
        dry_run: true,
        type: advancedRecovery ? 1 : 0,
        word_count: wordsCount,
        device: {
            path: device.path,
        },
    });

    if (!response.success) {
        dispatch(setError(response.payload.error));
    }

    dispatch(setStatus('finished'));
};

const recoverDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery, wordsCount } = getState().recovery;
    const { device } = getState().suite;
    if (!device || !device.features) return;
    dispatch(setError(''));
    dispatch(setStatus('in-progress'));

    const response = await TrezorConnect.recoveryDevice({
        type: advancedRecovery ? 1 : 0,
        word_count: wordsCount,
        passphrase_protection: DEVICE.DEFAULT_PASSPHRASE_PROTECTION,
        device: {
            path: device.path,
        },
    });

    if (!response.success) {
        dispatch(setError(response.payload.error));
    }

    dispatch(setStatus('finished'));
};

// Recovery mode is persistent on model T. This means that device stays in recovery mode even after reconnecting.
// In such case, we need to call again the call that brought device into recovery mode (either proper recovery
// or seed check). This way, communication is renewed and host starts receiving messages from device again.
const rerun = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;

    if (!device || !device.features) return;
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

    // cases that we cover here:

    // !initialized && !recovery_mode => set initial, clear error
    // initialized && !recovery_mode => set initial, clear error
    // !initialized && recovery_mode => recoveryDevice(),
    // initialized && recovery_mode => checkSeed()

    if (!features.recovery_mode) {
        dispatch(setStatus('finished'));
        dispatch(setError(''));
        return;
    }

    if (!features.initialized) {
        dispatch(recoverDevice());
    }

    if (features.initialized) {
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
