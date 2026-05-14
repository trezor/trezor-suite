import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { CommonParams, Params, Response } from '../params';

export declare function evoluGetDelegatedIdentityKey(
    params: Params<CommonParams>,
): Response<PROTO.EvoluDelegatedIdentityKey>;
