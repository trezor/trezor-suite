import type { TronSignTransaction, TronSignedTx } from './common';
import type { Params, Response } from '../../params';

export declare function tronSignTransaction(
    params: Params<TronSignTransaction>,
): Response<TronSignedTx>;
