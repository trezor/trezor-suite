import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import type { Signature, Slot, SolanaAPI } from '@trezor/network-solana/types';

import type { ContextType } from '../baseWorker';

export type Context = ContextType<SolanaAPI> & {
    getTokenMetadata: () => Promise<TokenDetailByMint>;
    onSubscriptionsClosed: () => void;
};

export type Request<T> = T & Context;

export type SignatureWithSlot = {
    signature: Signature;
    slot: Slot;
};
