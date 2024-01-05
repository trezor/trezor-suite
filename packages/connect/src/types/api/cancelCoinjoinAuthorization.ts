import { Static, Type } from '@trezor/schema-utils';
import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export type CancelCoinjoinAuthorization = Static<typeof CancelCoinjoinAuthorization>;
export const CancelCoinjoinAuthorization = Type.Object({
    preauthorized: Type.Optional(Type.Boolean()),
});

export declare function cancelCoinjoinAuthorization(
    params: Params<CancelCoinjoinAuthorization>,
): Response<PROTO.Success>;
