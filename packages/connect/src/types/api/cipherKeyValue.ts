/**
 * Asks device to encrypt value using the private key derived by given BIP32
 * path and the given key. IV is always computed automatically.
 */

import type { Params, BundledParams, Response, BundledResponse } from '../params';

export interface CipherKeyValue {
    path: string | number[];
    key: string;
    value: string | Buffer;
    encrypt?: boolean;
    askOnEncrypt?: boolean;
    askOnDecrypt?: boolean;
    iv?: string;
}

export interface CipheredValue {
    value: string;
}

export declare function cipherKeyValue(params: Params<CipherKeyValue>): Response<CipheredValue>;
export declare function cipherKeyValue(
    params: BundledParams<CipherKeyValue>,
): BundledResponse<CipheredValue>;
