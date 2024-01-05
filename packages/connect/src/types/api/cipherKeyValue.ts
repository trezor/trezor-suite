import { Params, BundledParams, Response, DerivationPath } from '../params';
import { Static, Type } from '@trezor/schema-utils';

export type CipherKeyValue = Static<typeof CipherKeyValue>;
export const CipherKeyValue = Type.Object({
    path: DerivationPath,
    key: Type.String(),
    value: Type.Union([Type.String(), Type.Buffer()]),
    encrypt: Type.Optional(Type.Boolean()),
    askOnEncrypt: Type.Optional(Type.Boolean()),
    askOnDecrypt: Type.Optional(Type.Boolean()),
    iv: Type.Optional(Type.Union([Type.String(), Type.Buffer()])),
});

export interface CipheredValue {
    value: string;
}

export declare function cipherKeyValue(params: Params<CipherKeyValue>): Response<CipheredValue>;
export declare function cipherKeyValue(
    params: BundledParams<CipherKeyValue>,
): Response<CipheredValue[]>;
