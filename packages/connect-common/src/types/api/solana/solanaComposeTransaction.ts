import type { SolanaComposeTransaction, SolanaComposedTransaction } from './common';
import type { DeviceFreeParams, Response } from '../../params';

export declare function solanaComposeTransaction(
    params: DeviceFreeParams<SolanaComposeTransaction>,
): Response<SolanaComposedTransaction>;
