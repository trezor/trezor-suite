import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function wardListPending(
    params: Params<PROTO.WARDListPendingEdits>,
): Response<PROTO.WARDListPendingEditsAck>;
