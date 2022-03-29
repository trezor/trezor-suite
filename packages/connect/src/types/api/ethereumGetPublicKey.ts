import type { GetPublicKey, Params, BundledParams, Response } from '../params';
import type { HDNodeResponse } from './getPublicKey';

export declare function ethereumGetPublicKey(
    params: Params<GetPublicKey>,
): Response<HDNodeResponse>;
export declare function ethereumGetPublicKey(
    params: BundledParams<GetPublicKey>,
): Response<HDNodeResponse[]>;
