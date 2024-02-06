import { networksCompatibility, NetworkSymbol } from '@suite-common/wallet-config';
import { Timeout } from '@trezor/type-utils';

/**
 * @deprecated
 */
export type BlockbookUrl = {
    coin: string;
    url: string;
    tor?: boolean; // Added by TOR
};

export type BackendType = 'blockbook' | 'electrum' | 'ripple' | 'blockfrost' | 'solana';

export type CustomBackend = {
    coin: (typeof networksCompatibility)[number]['symbol'];
    type: BackendType;
    urls: string[];
};

export type BackendSettings = Partial<{
    selected: BackendType;
    urls: Partial<{
        [type in BackendType]: string[];
    }>;
}>;

interface BlockchainReconnection {
    time: number; // timestamp when it will be resolved
}

export interface Blockchain {
    url?: string;
    explorer: {
        tx: string;
        account: string;
        queryString: string;
    };
    connected: boolean;
    subscribed?: boolean;
    error?: string;
    blockHash: string;
    blockHeight: number;
    version: string;
    reconnection?: BlockchainReconnection;
    syncTimeout?: Timeout;
    backends: BackendSettings;
}

export type BlockchainNetworks = {
    [key in NetworkSymbol]: Blockchain;
};
