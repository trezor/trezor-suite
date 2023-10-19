import type { Params, BundledParams, Response, DerivationPath } from '../params';

export interface CipherKeyValue {
    path: DerivationPath;
    key: string;
    value: string | Buffer;
    encrypt?: boolean;
    askOnEncrypt?: boolean;
    askOnDecrypt?: boolean;
    iv?: string | Buffer;
}

export interface CipheredValue {
    value: string;
}

export declare function cipherKeyValue(params: Params<CipherKeyValue>): Response<CipheredValue>;
export declare function cipherKeyValue(
    params: BundledParams<CipherKeyValue>,
): Response<CipheredValue[]>;
