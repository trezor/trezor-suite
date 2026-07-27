import type { StellarSignTransaction, StellarSignedTx } from './common';
import type { Params, Response } from '../../params';

export declare function stellarSignTransaction(
    params: Params<StellarSignTransaction>,
): Response<StellarSignedTx>;
