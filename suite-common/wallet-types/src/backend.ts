import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';
import { type BackendType, type NetworkSymbol } from '@suite-common/wallet-config';
import { type TimerId } from '@trezor/type-utils';

import { type AccountKey } from './account';

/**
 * @deprecated
 */
export type BlockbookUrl = {
    coin: string;
    url: string;
    tor?: boolean; // Added by TOR
};

export type CustomBackend = {
    symbol: NetworkSymbol;
    type: BackendType;
    urls: string[];
};

export type BackendSettings = Partial<{
    selected: BackendType;
    urls: Partial<{
        [type in BackendType]: string[];
    }>;
    gapLimit: number;
}>;

export interface ConnectionStatus {
    connected: boolean;
    error?: string;
    reconnectionTime?: number; // timestamp when it will be resolved
}

export interface Blockchain extends ConnectionStatus {
    url?: string;
    blockHash: string;
    blockHeight: number;
    version: string;
    syncTimeout?: TimerId;
    backends: BackendSettings;
    identityConnections?: {
        [identity: string]: ConnectionStatus;
    };
    /** Account whose transaction history is on screen, the only one a polled backend watches. */
    watchedAccountKey?: AccountKey;
}

export type BlockchainNetworks = Record<LegacyNetworkSymbol, Blockchain>;
