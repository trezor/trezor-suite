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
    type: 'info' | 'auth' | 'backend';
    shouldRender: boolean;
}

export type State =
    | {
          status: 'loaded';
          account: Account;
          network: Network;
          discovery: Discovery;
          // blockchain?: any; // TODO:
          // transactions?: any; // TODO:
          notification?: AccountNotification;
          loader?: Loader;
          exceptionPage?: ExceptionPage;
      }
    | {
          status: 'loading' | 'exception' | 'none';
          account?: Account;
          loader?: Loader;
          exceptionPage?: ExceptionPage;
      };

export const initialState: State = {
    status: 'none',
};

export default (state: State = initialState, action: Action): State => {
    if (action.type === ACCOUNT.UPDATE_SELECTED_ACCOUNT) return action.payload;
    if (action.type === ACCOUNT.DISPOSE) return initialState;
    return state;
};
