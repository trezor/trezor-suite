import { ObjectValues } from '@trezor/type-utils';
import { STATUS as discoveryStatus } from '@suite-common/wallet-constants';
import { Network } from '@suite-common/wallet-config';
import { Deferred } from '@trezor/utils';

import { Account } from './account';

export interface Discovery {
    deviceState: string;
    authConfirm: boolean;
    index: number;
    total: number;
    loaded: number;
    bundleSize: number;
    status: ObjectValues<typeof discoveryStatus>;
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

export interface DiscoveryItem {
    // @trezor/connect
    path: string;
    coin: Account['symbol'];
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
    pageSize?: number;
    // wallet
    index: number;
    accountType: Account['accountType'];
    networkType: Account['networkType'];
    backendType?: Account['backendType'];
    derivationType?: 0 | 1 | 2;
    lastKnownState?: Account['lastKnownState'];
}
