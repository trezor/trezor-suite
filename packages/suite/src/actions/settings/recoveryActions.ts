/* eslint-disable @typescript-eslint/camelcase */
import TrezorConnect from 'trezor-connect';
import { RECOVERY } from '@settings-actions/constants';

// todo
import { submitWord } from '@onboarding-actions/connectActions';
import { Dispatch, GetState } from '@suite-types';

type WordCount = 12 | 18 | 24;

export type RecoveryActions =
    | { type: typeof RECOVERY.SET_WORDS_COUNT; payload: WordCount }
    | { type: typeof RECOVERY.SET_ADVANCED_RECOVERY; payload: boolean };

const setWordsCount = (count: WordCount) => ({
    type: RECOVERY.SET_WORDS_COUNT,
    payload: count,
});

const setAdvancedRecovery = (value: boolean) => ({
    type: RECOVERY.SET_ADVANCED_RECOVERY,
    payload: value,
});

// todo bip39 type
const submit = (word: string) => async (dispatch: Dispatch) => {
    await dispatch(submitWord({ word }));
};

const checkSeed = () => async (_dispatch: Dispatch, getState: GetState) => {
    const { advancedRecovery } = getState().settings.recovery;
    const { device } = getState().suite;

    await TrezorConnect.recoveryDevice({
        dry_run: true,
        type: advancedRecovery ? 1 : 0,
        device,
    });
};

export { submit, setWordsCount, setAdvancedRecovery, checkSeed };
