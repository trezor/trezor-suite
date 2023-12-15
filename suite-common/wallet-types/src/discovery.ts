import { ObjectValues } from '@trezor/type-utils';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { Network } from '@suite-common/wallet-config';
import { Deferred } from '@trezor/utils';

import { Account, AccountBackendSpecific } from './account';

export interface Discovery {
    deviceState: string;
    authConfirm: boolean;
    index: number;
    total: number;
    loaded: number;
    bundleSize: number;
    status: ObjectValues<typeof DiscoveryStatus>;
    // coins which failed to load
    failed: {
        symbol: Network['symbol'];
        index: number;
        accountType: NonNullable<Network['accountType']>;
        error: string;
        fwException?: string;
    }[];
    networks: Network['symbol'][];
    running?: Deferred<void>;
    error?: string;
    errorCode?: string | number;
    // Array of account types which should be discovered for given device.
    // It will be set during discovery process if cardano network is enabled.
    availableCardanoDerivations?: ('normal' | 'legacy' | 'ledger')[];
}

export type PartialDiscovery = { deviceState: string } & Partial<Discovery>;

export type DiscoveryItem = {
    // @trezor/connect
    path: string;
    unlockPath?: Account['unlockPath'];
    coin: Account['symbol'];
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
    pageSize?: number;
    suppressBackupWarning?: boolean;
    // Useful to skip additional getFeatures call which is redundant in discovery
    skipFinalReload?: boolean;
    // wallet
    index: number;
    accountType: Account['accountType'];
    networkType: Account['networkType'];
    derivationType?: 0 | 1 | 2;
} & AccountBackendSpecific;
