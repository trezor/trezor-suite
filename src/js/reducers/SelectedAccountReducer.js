/* @flow */


import * as ACCOUNT from '../actions/constants/account';

import type {
    Action,
    Account,
    Coin,
    Token,
    PendingTx,
    Discovery,
    Web3Instance,
} from '~/flowtype';

export type State = {
    location?: string;

    account: ?Account;
    network: ?Coin;
    tokens: Array<Token>,
    pending: Array<PendingTx>,
    web3: ?Web3Instance,
    discovery: ?Discovery
};

export const initialState: State = {
    location: '/',
    account: null,
    network: null,
    tokens: [],
    pending: [],
    web3: null,
    discovery: null,
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            return action.payload;

        default:
            return state;
    }
};