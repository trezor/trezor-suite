import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { BundledParams, Params, Response } from '../params';
import { DerivationPath } from '../params';

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
