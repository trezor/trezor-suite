import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import type { StellarConnection } from '@trezor/network-stellar/types';

import type { ContextType } from '../baseWorker';

export type Context = ContextType<StellarConnection> & {
    getTokenMetadata: () => Promise<TokenDetailByMint>;
    /** Base reserve in stroops, read once per worker. */
    getBaseReserve: () => Promise<string>;
};

export type Request<T> = T & Context;
