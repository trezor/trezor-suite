/* @flow */
'use strict';

import EthereumjsUtil from 'ethereumjs-util';
import * as SUMMARY from './constants/summary';
import * as TOKEN from './constants/token';
import * as ADDRESS from './constants/address';
import { resolveAfter } from '../utils/promiseUtils';
import { getTokenInfoAsync, getTokenBalanceAsync } from './Web3Actions';
import { initialState } from '../reducers/SummaryReducer';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';

import type { ThunkAction, AsyncAction, Action, GetState, Dispatch } from '../flowtype';
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

export const init = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
    
        const state: State = {
            ...initialState,
        };

        dispatch({
            type: SUMMARY.INIT,
            state: state
        });
    }
}


export const update = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const {
            abstractAccount,
            router
        } = getState();

        const isLocationChanged: boolean = router.location.pathname !== abstractAccount.location;
        if (isLocationChanged) {
            dispatch( init() );
            return;
        }
    }
}

export const dispose = (): Action => {
    return {
        type: SUMMARY.DISPOSE
    }
}

export const onDetailsToggle = (): Action => {
    return {
        type: SUMMARY.DETAILS_TOGGLE
    }
}

