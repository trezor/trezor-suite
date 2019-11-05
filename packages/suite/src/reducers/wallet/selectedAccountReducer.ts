import produce from 'immer';
import { ACCOUNT } from '@wallet-actions/constants';
import { Props as NotificationProps } from '@suite-components/Notification';
import { Action, ExtendedMessageDescriptor } from '@suite-types';
import { Network, Account, Discovery } from '@wallet-types';

export interface Loader {
    type: string;
    title: string | ExtendedMessageDescriptor;
    message?: string | ExtendedMessageDescriptor;
    actions?: NotificationProps['actions'];
}

export interface ExceptionPage {
    type?: string;
    title?: string | ExtendedMessageDescriptor;
    message?: string | ExtendedMessageDescriptor;
    symbol: string;
}

export interface AccountNotification extends NotificationProps {
    type: 'info' | 'backend';
    shouldRender: boolean;
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
    account: null,
    network: null,
    discovery: null,
    loader: null,
    notification: null,
    shouldRender: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, _draft => {
        switch (action.type) {
            case ACCOUNT.DISPOSE:
                return initialState;
            case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
                return action.payload;
            // no default
        }
    });
};
