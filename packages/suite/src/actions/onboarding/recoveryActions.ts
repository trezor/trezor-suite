import { SET_WORDS_COUNT, SET_ADVANCED_RECOVERY } from '@onboarding-types/recovery';

import { submitWord } from './connectActions';
import { Dispatch } from '@suite-types';

const setWordsCount = (count: number) => ({
    type: SET_WORDS_COUNT,
    payload: count,
});

const setAdvancedRecovery = (value: boolean) => ({
    type: SET_ADVANCED_RECOVERY,
    payload: value,
});

const submit = (word: string) => async (dispatch: Dispatch) => {
    await dispatch(submitWord({ word }));
};

export { submit, setWordsCount, setAdvancedRecovery };
