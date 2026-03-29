import type { Params, Response } from '../params';
import type { TronComposeTransaction, TronComposedTransaction } from './tron';

export declare function tronComposeTransaction(
    params: Params<TronComposeTransaction>,
): Response<TronComposedTransaction>;
