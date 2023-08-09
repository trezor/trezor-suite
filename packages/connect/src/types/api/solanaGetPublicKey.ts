import type { GetPublicKey, Params, BundledParams, Response } from '../params';
import type { SolanaPublicKey } from './solana';

export declare function solanaGetPublicKey(params: Params<GetPublicKey>): Response<SolanaPublicKey>;
export declare function solanaGetPublicKey(
    params: BundledParams<GetPublicKey>,
): Response<SolanaPublicKey[]>;
