import { Static, Type } from '@trezor/schema-utils';

import { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export type ChangeLanguage = Static<typeof ChangeLanguage>;

export const ChangeLanguage = Type.Union([
    Type.Object({
        binary: Type.Optional(Type.Undefined()),
        language: Type.String(),
        baseUrl: Type.Optional(Type.String()),
    }),
    Type.Object({
        binary: Type.ArrayBuffer(),
        language: Type.Optional(Type.Undefined()),
        baseUrl: Type.Optional(Type.Undefined()),
    }),
]);

export declare function changeLanguage(params: Params<ChangeLanguage>): Response<PROTO.Success>;
