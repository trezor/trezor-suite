import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type CancelCoinjoinAuthorization = Static<typeof CancelCoinjoinAuthorization>;
export const CancelCoinjoinAuthorization = Type.Object({
    preauthorized: Type.Optional(Type.Boolean()),
});

export declare function cancelCoinjoinAuthorization(
    params: Params<CancelCoinjoinAuthorization>,
): Response<PROTO.Success>;
