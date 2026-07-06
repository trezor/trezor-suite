import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbQueueOfflineOperation(
    params: Params<PROTO.AuthDbQueueOfflineOperation>,
): Response<PROTO.AuthDbQueueOfflineOperationResponse>;
