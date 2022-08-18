import { Network } from '@suite-common/wallet-config';

import { Discovery } from './discovery';
import { Account, WalletParams } from './account';

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
    account?: Account;
    network?: Network;
    discovery?: Discovery;
    params?: undefined;
}

export interface AccountLoaded {
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

export type AccountNone = {
    status: 'none';
    loader?: undefined;
    mode?: undefined;
    account?: undefined;
    network?: undefined;
    discovery?: undefined;
    params?: undefined;
};

export type AccountState = AccountLoaded | AccountLoading | AccountException | AccountNone;
