import type { SolanaComposeTransaction, SolanaComposedTransaction } from './common';
import type { Params, Response } from '../../params';

export declare function solanaComposeTransaction(
    params: Params<SolanaComposeTransaction>,
): Response<SolanaComposedTransaction>;
