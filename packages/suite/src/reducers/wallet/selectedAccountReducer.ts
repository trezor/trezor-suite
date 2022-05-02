import { ACCOUNT } from '@wallet-actions/constants';
import type { Action } from '@suite-types';
import type { Network, Account, Discovery, WalletParams } from '@wallet-types';

// Context notifications view
// Account is in "watch only" mode
export type AccountWatchOnlyMode =
    | 'account-loading-others'
    | 'auth-confirm-failed' // Empty wallet confirmation failed
    | 'device-disconnected'
    | 'device-unavailable' // Device has passphrase_protection disabled
    | 'backend-disconnected';

// 100% view
// // Account loaders
export interface AccountLoading {
    status: 'loading';
    loader:
        | 'waiting-for-device' // No selectedDevice
        | 'auth' // Waiting for device.state
        | 'account-loading'; // Waiting for account
    mode?: undefined;
    account?: undefined;
    network?: Network;
    discovery?: Discovery;
    params?: undefined;
}

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
    | {
          status: 'none';
          loader?: undefined;
          mode?: undefined;
          account?: undefined;
          network?: undefined;
          discovery?: undefined;
          params?: undefined;
      };

export const initialState: State = {
    status: 'none',
};

const selectedAccountReducer = (state: State = initialState, action: Action): State => {
    if (action.type === ACCOUNT.UPDATE_SELECTED_ACCOUNT) return action.payload;
    if (action.type === ACCOUNT.DISPOSE) return initialState;
    return state;
};

export default selectedAccountReducer;
