import type { Params, Response } from '../params';
import type { SolanaComposeTransaction, SolanaComposedTransaction } from './solana';

export declare function solanaComposeTransaction(
    params: Params<SolanaComposeTransaction>,
): Response<SolanaComposedTransaction>;
