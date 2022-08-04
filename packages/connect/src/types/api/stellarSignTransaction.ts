import type { Params, Response } from '../params';

// todo:maybe we could unify terminology SignTransaction vs SignTx (across all methods)
import type { StellarSignTransaction, StellarSignedTx } from './stellar';

export declare function stellarSignTransaction(
    params: Params<StellarSignTransaction>,
): Response<StellarSignedTx>;
