import type { SolanaPublicKey } from './common';
import type { BundledParams, GetPublicKey, Params, Response } from '../../params';

export declare function solanaGetPublicKey(params: Params<GetPublicKey>): Response<SolanaPublicKey>;
export declare function solanaGetPublicKey(
    params: BundledParams<GetPublicKey>,
): Response<SolanaPublicKey[]>;
