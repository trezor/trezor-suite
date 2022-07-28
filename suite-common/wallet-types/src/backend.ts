import { networksCompatibility } from '@suite-common/wallet-config';

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
    coin: typeof networksCompatibility[number]['symbol'];
    type: BackendType;
    urls: string[];
};
