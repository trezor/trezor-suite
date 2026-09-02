import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import type { StellarAPI } from '@trezor/network-stellar/types';

import type { ContextType } from '../baseWorker';

export type Context = ContextType<StellarAPI> & {
    getTokenMetadata: () => Promise<TokenDetailByMint>;
};

export type Request<T> = T & Context;
