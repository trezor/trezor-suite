import type { SolanaSignTransaction, SolanaSignedTransaction } from './common';
import type { Params, Response } from '../../params';

export declare function solanaSignTransaction(
    params: Params<SolanaSignTransaction>,
): Response<SolanaSignedTransaction>;
