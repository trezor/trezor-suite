import { Network } from '@suite-common/wallet-config';

import { Discovery } from './discovery';
import { Account, WalletParams } from './account';

// 100% view
// // Account loaders
export interface SelectedAccountLoading {
    status: 'loading';
    loader:
        | 'waiting-for-device' // No selectedDevice
        | 'auth' // Waiting for device.state
        | 'account-loading'; // Waiting for account
    account?: Account;
    network?: Network;
    discovery?: Discovery;
    params?: WalletParams;
}

export interface SelectedAccountLoaded {
    status: 'loaded';
    loader?: undefined;
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
          account?: undefined;
          network: Network;
          discovery: Discovery;
          params: WalletParams;
      };

export type SelectedAccountNone = {
    status: 'none';
    loader?: undefined;
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
