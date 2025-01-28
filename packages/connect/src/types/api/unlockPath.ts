import { Static, Type } from '@trezor/schema-utils';

import type { PROTO } from '../../constants';
import { DerivationPath, Params, Response } from '../params';

export type UnlockPathParams = Static<typeof UnlockPathParams>;
export const UnlockPathParams = Type.Object({
    path: DerivationPath,
    mac: Type.Optional(Type.String()),
});

export declare function unlockPath(params: Params<UnlockPathParams>): Response<PROTO.UnlockPath>;
