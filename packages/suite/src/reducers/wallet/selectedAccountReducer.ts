import { ACCOUNT } from '@wallet-actions/constants';
import { accountsActions } from '@suite-common/wallet-core';
import type { Action } from '@suite-types';
import type { Network, Account, Discovery, WalletParams } from '@wallet-types';
import type { AccountLoading, AccountNone, AccountWatchOnlyMode } from '@suite-common/wallet-types';

// 100% view
// Account exception views
export type AccountException =
    | {
          status: 'exception';
          loader: 'auth-failed' | 'discovery-error' | 'discovery-empty'; // No network enabled in settings
          mode?: AccountWatchOnlyMode[];
          account?: undefined;
          network?: Network;
          discovery?: Discovery;
          params?: WalletParams;
      }
    | {
          status: 'exception';
          loader:
              | 'account-not-loaded' // Account discovery failed
              | 'account-not-enabled' // Requested account network is not enabled in settings
              | 'account-not-exists'; // Requested account network is not listed in NETWORKS
          mode?: AccountWatchOnlyMode[];
          account?: undefined;
          network: Network;
          discovery: Discovery;
          params: WalletParams;
      };

export type State =
    | {
          status: 'loaded';
          loader?: undefined;
          mode: AccountWatchOnlyMode[] | undefined;
          account: Account;
          network: Network;
          discovery: Discovery;
          params: WalletParams;
          // blockchain?: any; // TODO:
          // transactions?: any; // TODO:
      }
    | AccountLoading
    | AccountException
    | AccountNone;

export const initialState: State = {
    status: 'none',
};

const selectedAccountReducer = (state: State = initialState, action: Action): State => {
    if (action.type === ACCOUNT.UPDATE_SELECTED_ACCOUNT) return action.payload;
    if (accountsActions.disposeAccount.match(action)) return initialState;
    return state;
};

export default selectedAccountReducer;
