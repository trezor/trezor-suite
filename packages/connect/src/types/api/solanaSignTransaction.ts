import type { Params, Response } from '../params';
import type { SolanaSignTransaction, SolanaSignedTransaction } from './solana';

export declare function solanaSignTransaction(
    params: Params<SolanaSignTransaction>,
): Response<SolanaSignedTransaction>;
