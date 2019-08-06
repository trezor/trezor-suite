import { Dispatch, GetState } from '@suite-types';

import { SET_WORD, SET_WORDS_COUNT, SET_ADVANCED_RECOVERY } from '@suite/types/onboarding/recovery';
import { submitWord } from './connectActions';

const setWord = (word: string) => ({
    type: SET_WORD,
    word,
});

const setWordsCount = (count: number) => ({
    type: SET_WORDS_COUNT,
    count,
});

const setAdvancedRecovery = (value: boolean) => ({
    type: SET_ADVANCED_RECOVERY,
    value,
});

const submit = (word?: string) => (dispatch: Dispatch, getState: GetState) => {
    const normalizedWord = word || getState().onboarding.recovery.word;
    if (normalizedWord) {
        dispatch(submitWord({ word: `${normalizedWord}` })).then(() => {
            dispatch({
                type: SET_WORD,
                word: null,
            });
        });
    }
};

export { setWord, submit, setWordsCount, setAdvancedRecovery };
