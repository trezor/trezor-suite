import type { BundledParams, GetPublicKey, Params, Response } from '../params';
import { EosPublicKey } from './eos';

export declare function eosGetPublicKey(params: Params<GetPublicKey>): Response<EosPublicKey>;
export declare function eosGetPublicKey(
    params: BundledParams<GetPublicKey>,
): Response<EosPublicKey[]>;
