import type { Params, BundledParams, Response } from '../params';
import { EosGetPublicKey, EosPublicKey } from './eos';

export declare function eosGetPublicKey(params: Params<EosGetPublicKey>): Response<EosPublicKey>;
export declare function eosGetPublicKey(
    params: BundledParams<EosGetPublicKey>,
): Response<EosPublicKey[]>;
