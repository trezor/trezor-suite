import type { MoneroComposeTransaction, MoneroComposeTransactionResult } from './common';
import type { Params, Response } from '../../params';

export declare function moneroComposeTransaction(
    params: Params<MoneroComposeTransaction>,
): Response<MoneroComposeTransactionResult>;
