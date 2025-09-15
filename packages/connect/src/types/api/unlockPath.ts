import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Static, Type } from '@trezor/schema-utils';

import { DerivationPath, Params, Response } from '../params';

export type UnlockPathParams = Static<typeof UnlockPathParams>;
export const UnlockPathParams = Type.Object({
    path: DerivationPath,
    mac: Type.Optional(Type.String()),
});

export declare function unlockPath(params: Params<UnlockPathParams>): Response<PROTO.UnlockPath>;
