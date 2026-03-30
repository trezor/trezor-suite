import type { Params, Response } from '../params';
import type { MoneroSignTransaction, MoneroSignedTransaction } from './monero';

export declare function moneroSignTransaction(
    params: Params<MoneroSignTransaction>,
): Response<MoneroSignedTransaction>;
