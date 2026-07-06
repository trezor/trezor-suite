import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbGetOfflineOperations(
    params: Params<PROTO.AuthDbGetOfflineOperations>,
): Response<PROTO.AuthDbGetOfflineOperationsResponse>;
