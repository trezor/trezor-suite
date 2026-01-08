import type { Params, Response } from '../params';
import { TronSignTransaction, TronSignedTx } from './tron';

export declare function tronSignTransaction(
    params: Params<TronSignTransaction>,
): Response<TronSignedTx>;
