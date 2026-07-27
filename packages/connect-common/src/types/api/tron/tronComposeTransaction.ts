import type { TronComposeTransaction, TronComposedTransaction } from './common';
import type { Params, Response } from '../../params';

export declare function tronComposeTransaction(
    params: Params<TronComposeTransaction>,
): Response<TronComposedTransaction>;
