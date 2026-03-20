import { type TokenInfo } from '@trezor/blockchain-link-types';

export interface StellarTokenInfo extends TokenInfo {
    homeDomain?: string;
    rating?: number;
}
