import * as ACCOUNT from '@wallet-actions/constants/accountConstants';

import { Action } from '@suite/types/suite';
import { Network, Account } from '@suite/types/wallet';
import { Discovery } from './discoveryReducer';

export interface Loader {
    type: string;
    title: string;
    message?: string;
}

export interface Notification {
    variant: string;
    title: string;
    message?: string;
}

export interface ExceptionPage {
    type?: string;
    title?: string;
    message?: string;
    shortcut: string;
}

interface AccountNotification extends Notification {
    type: 'info' | 'backend';
}
export interface State {
    // location: string;
    account?: Account | null;
    network?: Network | null;
    // tokens: Token[];
    // pending: Transaction[];
    discovery?: Discovery | null;
    loader?: Loader | null;
    notification?: AccountNotification | null;
    exceptionPage?: ExceptionPage | null;
    shouldRender: boolean;
}

export const initialState: State = {
    // location: '/',
    account: null,
    // network: null,
    // tokens: [],
    // pending: [],
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
