import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';
import { DerivationPath } from '../params';

export type UnlockPathParams = Static<typeof UnlockPathParams>;
export const UnlockPathParams = Type.Object({
    path: DerivationPath,
    mac: Type.Optional(Type.String()),
});

export declare function unlockPath(params: Params<UnlockPathParams>): Response<PROTO.UnlockPath>;
