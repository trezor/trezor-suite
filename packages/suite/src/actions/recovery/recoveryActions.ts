/* eslint-disable @typescript-eslint/camelcase */
import TrezorConnect from 'trezor-connect';
import { RECOVERY } from '@settings-actions/constants';

// todo
import { submitWord } from '@onboarding-actions/connectActions';
import { Dispatch, GetState, Action } from '@suite-types';
import { WordCount } from '@settings-types';

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

// todo bip39 type
const submit = (word: string) => async (dispatch: Dispatch) => {
    await dispatch(submitWord({ word }));
};

const checkSeed = () => async (dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery, wordsCount } = getState().settings.recovery;
    const { device } = getState().suite;
    if (!device || !device.features) return;

    dispatch(setStatus('in-progress'));

    const response = await TrezorConnect.recoveryDevice({
        dry_run: true,
        type: advancedRecovery ? 1 : 0,
        word_count: wordsCount,
        device,
    });

    if (!response.success) {
        dispatch(setError(response.payload.error));
    }

    dispatch(setStatus('finished'));
};

const recoverDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery, wordsCount } = getState().settings.recovery;
    const { device } = getState().suite;
    if (!device || !device.features) return;

    dispatch(setStatus('in-progress'));

    const response = await TrezorConnect.recoveryDevice({
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

export {
    submit,
    setWordsCount,
    setAdvancedRecovery,
    checkSeed,
    recoverDevice,
    resetReducer,
    setStatus,
};
