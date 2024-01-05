import type { Params, Response } from '../params';

import { Static, Type } from '@trezor/schema-utils';
import { DerivationPath } from '../params';
import { PROTO } from '../../constants';

export type AuthorizeCoinjoin = Static<typeof AuthorizeCoinjoin>;
export const AuthorizeCoinjoin = Type.Object({
    path: DerivationPath,
    coordinator: Type.String(),
    maxRounds: Type.Number(),
    maxCoordinatorFeeRate: Type.Number(),
    maxFeePerKvbyte: Type.Number(),
    coin: Type.Optional(Type.String()),
    scriptType: Type.Optional(PROTO.InternalInputScriptType),
    amountUnit: Type.Optional(PROTO.EnumAmountUnit),
    preauthorized: Type.Optional(Type.Boolean()),
});

export declare function authorizeCoinjoin(
    params: Params<AuthorizeCoinjoin>,
): Response<PROTO.Success>;
