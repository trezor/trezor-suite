import { ACCOUNT } from '@wallet-actions/constants';
import { Action } from '@suite-types';
import { Network, Account, Discovery } from '@wallet-types';

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
    account?: undefined;
}

// 100% view
// Account exception views
export type AccountException =
    | {
          status: 'exception';
          loader:
              | 'auth-failed'
              | 'discovery-error' // TODO: Discovery failed on something different than expected "bundle exception"
              | 'discovery-empty'; // No network enabled in settings
          mode?: AccountWatchOnlyMode[];
          network?: Network;
          discovery?: Discovery;
          account?: undefined;
      }
    | {
          status: 'exception';
          loader:
              | 'discovery-error' // TODO: Discovery failed on something different than expected "bundle exception"
              | 'account-not-loaded' // Account discovery failed
              | 'account-not-enabled' // Requested account network is not enabled in settings
              | 'account-not-exists'; // Requested account network is not listed in NETWORKS
          mode?: AccountWatchOnlyMode[];
          network: Network;
          discovery: Discovery;
          account?: undefined;
      };

export type State =
    | {
          status: 'loaded';
          account: Account;
          network: Network;
          discovery: Discovery;
          blockchain?: any; // TODO:
          // transactions?: any; // TODO:
          mode: AccountWatchOnlyMode[] | undefined;
          loader?: undefined;
      }
    | AccountLoading
    | AccountException
    | {
          status: 'none';
          account?: undefined;
          loader?: undefined;
          mode?: undefined;
      };

export const initialState: State = {
    status: 'none',
};

export default (state: State = initialState, action: Action): State => {
    if (action.type === ACCOUNT.UPDATE_SELECTED_ACCOUNT) return action.payload;
    if (action.type === ACCOUNT.DISPOSE) return initialState;
    return state;
};
