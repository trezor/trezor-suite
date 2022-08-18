import { Network } from '@suite-common/wallet-config';

import { Discovery } from './discovery';
import { Account } from './account';

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

export interface AccountNone {
    status: 'none';
    loader?: undefined;
    mode?: undefined;
    account?: undefined;
    network?: undefined;
    discovery?: undefined;
    params?: undefined;
}
