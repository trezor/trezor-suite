/* @flow */
import * as storageUtils from 'utils/storage';
import { findToken } from 'reducers/utils';

import type { State as EthereumSendFormState } from 'reducers/SendFormEthereumReducer';
import type { State as RippleSendFormState } from 'reducers/SendFormRippleReducer';
import type {
    ThunkAction,
    PayloadAction,
    GetState,
    Dispatch,
} from 'flowtype';

const TYPE: 'session' = 'session';
const { STORAGE_PATH } = storageUtils;
const KEY_TX_DRAFT: string = `${STORAGE_PATH}txdraft`;

const getTxDraftKey = (getState: GetState): string => {
    const { pathname } = getState().router.location;
    return `${KEY_TX_DRAFT}${pathname}`;
};

export const saveDraftTransaction = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state = getState().sendFormEthereum;
    if (state.untouched) return;

    const key = getTxDraftKey(getState);
    storageUtils.set(TYPE, key, JSON.stringify(state));
};

export const loadEthereumDraftTransaction = (): PayloadAction<?EthereumSendFormState> => (dispatch: Dispatch, getState: GetState): ?EthereumSendFormState => {
    const key = getTxDraftKey(getState);
    const value: ?string = storageUtils.get(TYPE, key);
    if (!value) return null;
    const state: ?EthereumSendFormState = JSON.parse(value);
    if (!state) return null;
    // decide if draft is valid and should be returned
    // ignore this draft if has any error
    if (Object.keys(state.errors).length > 0) {
        storageUtils.remove(TYPE, key);
        return null;
    }
    // check if selected currency is token and make sure that this token is added into account
    if (state.currency !== state.networkSymbol) {
        const { account, tokens } = getState().selectedAccount;
        if (!account) return null;
        const token = findToken(tokens, account.descriptor, state.currency, account.deviceState);
        if (!token) {
            storageUtils.remove(TYPE, key);
            return null;
        }
    }
    return state;
};

export const loadRippleDraftTransaction = (): PayloadAction<?RippleSendFormState> => (dispatch: Dispatch, getState: GetState): ?RippleSendFormState => {
    const key = getTxDraftKey(getState);
    const value: ?string = storageUtils.get(TYPE, key);
    if (!value) return null;
    const state: ?RippleSendFormState = JSON.parse(value);
    if (!state) return null;
    // decide if draft is valid and should be returned
    // ignore this draft if has any error
    if (Object.keys(state.errors).length > 0) {
        storageUtils.remove(TYPE, key);
        return null;
    }
    return state;
};

export const clear = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const key = getTxDraftKey(getState);
    storageUtils.remove(TYPE, key);
};
