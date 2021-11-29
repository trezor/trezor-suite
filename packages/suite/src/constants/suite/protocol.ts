import type { Network } from '@wallet-types';

export enum PROTOCOL_SCHEME {
    BITCOIN = 'bitcoin',
    AOPP = 'aopp',
}

export const PROTOCOL_TO_NETWORK: Partial<{ [key in PROTOCOL_SCHEME]: Network['symbol'] }> = {
    [PROTOCOL_SCHEME.BITCOIN]: 'btc',
};
