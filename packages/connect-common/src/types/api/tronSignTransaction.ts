import type { Params, Response } from '../params';
import type { TronSignTransaction, TronSignedTx } from './tron';

export declare function tronSignTransaction(
    params: Params<TronSignTransaction>,
): Response<TronSignedTx>;
