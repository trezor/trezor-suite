/* @flow */
import * as SUMMARY from 'actions/constants/summary';
import { initialState } from 'reducers/SummaryReducer';

import type {
    ThunkAction, Action, Dispatch,
} from 'flowtype';
import type { State } from 'reducers/SummaryReducer';

export type SummaryAction = {
    type: typeof SUMMARY.INIT,
    state: State
} | {
    type: typeof SUMMARY.DISPOSE,
} | {
    type: typeof SUMMARY.DETAILS_TOGGLE
}

export const init = (): ThunkAction => (dispatch: Dispatch): void => {
    const state: State = {
        ...initialState,
    };

    dispatch({
        type: SUMMARY.INIT,
        state,
    });
};

export const dispose = (): Action => ({
    type: SUMMARY.DISPOSE,
});

export const onDetailsToggle = (): Action => ({
    type: SUMMARY.DETAILS_TOGGLE,
});
