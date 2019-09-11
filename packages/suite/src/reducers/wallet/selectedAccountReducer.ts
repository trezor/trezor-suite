import * as ACCOUNT from '@wallet-actions/constants/accountConstants';

import { Action } from '@suite/types/suite';
import { Network, Account } from '@suite/types/wallet';
import produce from 'immer';
import { Discovery } from './discoveryReducer';

export interface Loader {
    type: string;
    title: string;
    message?: string;
}

export interface Notification {
    variant: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message?: string;
}

export interface ExceptionPage {
    type?: string;
    title?: string;
    message?: string;
    symbol: string;
}

interface AccountNotification extends Notification {
    type: 'info' | 'backend';
}
export interface State {
    // location: string;
    account: Account | null;
    network: Network | null;
    // tokens: Token[];
    // pending: Transaction[];
    discovery: Discovery | null;
    loader: Loader | null;
    notification: AccountNotification | null;
    exceptionPage?: ExceptionPage;
    shouldRender: boolean;
}

export const initialState: State = {
    // location: '/',
    account: null,
    network: null,
    // tokens: [],
    // pending: [],
    discovery: null,
    loader: null,
    notification: null,
    shouldRender: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, _draft => {
        switch (action.type) {
            case ACCOUNT.DISPOSE:
                // TODO: Do we really need to reset the state at account dispose?
                // Currently, discovery proccess is per device and selected acc update is triggered on action below.
                // Right know it only makes sense to dispatch the action because multiple reducer are acting on it (eg reset state for receive tab)

                // return initialState;
                break;
            case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
                return action.payload;
            // no default
        }
    });
};
