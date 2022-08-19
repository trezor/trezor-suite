import { Network } from '@suite-common/wallet-config';

import { Discovery } from './discovery';
import { Account, WalletParams } from './account';

// Context notifications view
// Account is in "watch only" mode
export type SelectedAccountWatchOnlyMode =
    | 'account-loading-others'
    | 'auth-confirm-failed' // Empty wallet confirmation failed
    | 'device-disconnected'
    | 'device-unavailable' // Device has passphrase_protection disabled
    | 'backend-disconnected';

// 100% view
// // Account loaders
export interface SelectedAccountLoading {
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

export interface SelectedAccountLoaded {
    status: 'loaded';
    loader?: undefined;
    mode: SelectedAccountWatchOnlyMode[] | undefined;
    account: Account;
    network: Network;
    discovery: Discovery;
    params: WalletParams;
    // blockchain?: any; // TODO:
    // transactions?: any; // TODO:
}

// 100% view
// Account exception views
export type SelectedAccountException =
    | {
          status: 'exception';
          loader: 'auth-failed' | 'discovery-error' | 'discovery-empty'; // No network enabled in settings
          mode?: SelectedAccountWatchOnlyMode[];
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
          mode?: SelectedAccountWatchOnlyMode[];
          account?: undefined;
          network: Network;
          discovery: Discovery;
          params: WalletParams;
      };

export type SelectedAccountNone = {
    status: 'none';
    loader?: undefined;
    mode?: undefined;
    account?: undefined;
    network?: undefined;
    discovery?: undefined;
    params?: undefined;
};

export type SelectedAccountStatus =
    | SelectedAccountLoaded
    | SelectedAccountLoading
    | SelectedAccountException
    | SelectedAccountNone;
