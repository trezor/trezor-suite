import type { MoneroSendTransaction, MoneroSendTransactionResult } from './common';
import type { Params, Response } from '../../params';

export declare function moneroSendTransaction(
    params: Params<MoneroSendTransaction>,
): Response<MoneroSendTransactionResult>;
