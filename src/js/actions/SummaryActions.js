/* @flow */


import EthereumjsUtil from 'ethereumjs-util';
import * as SUMMARY from './constants/summary';
import * as TOKEN from './constants/token';
import { resolveAfter } from '../utils/promiseUtils';
import { initialState } from '../reducers/SummaryReducer';

import type {
    ThunkAction, AsyncAction, Action, GetState, Dispatch,
} from '~/flowtype';
import type { State } from '../reducers/SummaryReducer';
import type { Token } from '../reducers/TokensReducer';

export type SummaryAction = {
    type: typeof SUMMARY.INIT,
    state: State
} | {
    type: typeof SUMMARY.DISPOSE,
} | {
    type: typeof SUMMARY.DETAILS_TOGGLE
}

export const init = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
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
