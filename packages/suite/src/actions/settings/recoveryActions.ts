import { RECOVERY } from '@settings-actions/constants';

// todo
import { submitWord } from '@onboarding-actions/connectActions';
import { Dispatch } from '@suite-types';

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

export { submit, setWordsCount, setAdvancedRecovery };
