/* eslint-disable @typescript-eslint/camelcase */
import TrezorConnect from 'trezor-connect';
import { RECOVERY } from '@settings-actions/constants';

// todo
import { submitWord } from '@onboarding-actions/connectActions';
import { Dispatch, GetState, Action } from '@suite-types';
import { WordCount } from '@settings-types';

type ResultPayload = { success: boolean; error: string };

export type RecoveryActions =
    | { type: typeof RECOVERY.SET_WORDS_COUNT; payload: WordCount }
    | { type: typeof RECOVERY.SET_ADVANCED_RECOVERY; payload: boolean }
    | { type: typeof RECOVERY.SET_RESULT; payload: ResultPayload }
    | { type: typeof RECOVERY.RESET_REDUCER };

const setWordsCount = (count: WordCount) => ({
    type: RECOVERY.SET_WORDS_COUNT,
    payload: count,
});

const setAdvancedRecovery = (value: boolean) => ({
    type: RECOVERY.SET_ADVANCED_RECOVERY,
    payload: value,
});

const setResult = (payload: ResultPayload): Action => ({
    type: RECOVERY.SET_RESULT,
    payload,
});

const resetReducer = () => ({
    type: RECOVERY.RESET_REDUCER,
});

// todo bip39 type
const submit = (word: string) => async (dispatch: Dispatch) => {
    await dispatch(submitWord({ word }));
};

const checkSeed = () => async (dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery } = getState().settings.recovery;
    const { device } = getState().suite;

    const response = await TrezorConnect.recoveryDevice({
        dry_run: true,
        type: advancedRecovery ? 1 : 0,
        device,
    });

    if (!response.success) {
        return dispatch(setResult({ success: false, error: response.payload.error }));
    }

    dispatch(setResult({ success: true, error: '' }));
};

export { submit, setWordsCount, setAdvancedRecovery, setResult, checkSeed, resetReducer };
