import type { MoneroSignTransaction, MoneroSignedTransaction } from './common';
import type { Params, Response } from '../../params';

export declare function moneroSignTransaction(
    params: Params<MoneroSignTransaction>,
): Response<MoneroSignedTransaction>;
