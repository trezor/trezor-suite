import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import type { StellarAPI } from '@trezor/network-stellar/types';

import type { ContextType } from '../baseWorker';

export type Context = ContextType<StellarAPI> & {
    getTokenMetadata: () => Promise<TokenDetailByMint>;
    /** Current base reserve in stroops, read once per worker from the ledger header. */
    getBaseReserve: () => Promise<string>;
};

export type Request<T> = T & Context;
