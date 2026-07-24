import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbSetRoot(
    params: Params<PROTO.WARDDebugSetRoot>,
): Response<PROTO.WARDDebugSetRootAck>;
