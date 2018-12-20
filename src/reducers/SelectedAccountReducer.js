/* @flow */
import * as ACCOUNT from 'actions/constants/account';

import type {
    Action,
    Account,
    Network,
    Token,
    Transaction,
    Discovery,
} from 'flowtype';

export type Loader = {
    type: string,
    title: string,
    message?: string,
}

export type Notification = {
    type: string,
    title: string,
    message?: string,
}

export type ExceptionPage = {
    type: ?string,
    title: ?string,
    message: ?string,
    shortcut: string,
}

export type State = {
    location: string,
    account: ?Account,
    network: ?Network,
    tokens: Array<Token>,
    pending: Array<Transaction>,
    discovery: ?Discovery,
    loader: ?Loader,
    notification: ?Notification,
    exceptionPage: ?ExceptionPage,
    shouldRender: boolean,
};

export const initialState: State = {
    location: '/',
    account: null,
    network: null,
    tokens: [],
    pending: [],
    discovery: null,
    loader: null,
    notification: null,
    exceptionPage: null,
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