import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';
import { type BackendType, type NetworkSymbol } from '@suite-common/wallet-config';
import type { CardanoProtocolParameters } from '@trezor/blockchain-link-types';
import type { BlockchainLinkAnonRpc } from '@trezor/connect';
import { type Getter } from '@trezor/dependency-injection';
import { type TimerId } from '@trezor/type-utils';

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

export type GetAnonRpcSettingsDep = {
    // The anon-rpc network a backend's RPC is routed through, or undefined to connect directly.
    getAnonRpcSettings: Getter<[backend: CustomBackend], BlockchainLinkAnonRpc | undefined>;
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
    cardanoProtocolParameters?: CardanoProtocolParameters;
    consensusBranchId?: number;
    syncTimeout?: TimerId;
    backends: BackendSettings;
    identityConnections?: {
        [identity: string]: ConnectionStatus;
    };
}

export type BlockchainNetworks = Record<LegacyNetworkSymbol, Blockchain>;
