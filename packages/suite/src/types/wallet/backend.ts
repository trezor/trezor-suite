import { NETWORKS } from '@wallet-config';

/**
 * @deprecated
 */
export type BlockbookUrl = {
    coin: string;
    url: string;
    tor?: boolean; // Added by TOR
};

export type BackendType = 'blockbook' | 'electrum' | 'ripple' | 'blockfrost';

export type CustomBackend = {
    coin: typeof NETWORKS[number]['symbol'];
    type: BackendType;
    urls: string[];
};
