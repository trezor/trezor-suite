/* @flow */
import * as ACCOUNT from 'actions/constants/account';

import type {
    Action,
    Account,
    Network,
    Token,
    PendingTx,
    Discovery,
} from 'flowtype';

export type State = {
    location: string;
    account: ?Account;
    network: ?Network;
    tokens: Array<Token>,
    pending: Array<PendingTx>,
    discovery: ?Discovery,
    notification: {
        type: ?string,
        title: ?string,
        message: ?string,
    },
    shouldRender: boolean,
};

export const initialState: State = {
    location: '/',
    account: null,
    network: null,
    tokens: [],
    pending: [],
    discovery: null,
    notification: {
        type: null,
        title: null,
        message: null,
    },
    shouldRender: false,
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ACCOUNT.DISPOSE:
            return initialState;
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            return action.payload;
        default:
            return state;
    }
};