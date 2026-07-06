import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbDeleteOfflineOperations(
    params: Params<PROTO.AuthDbDeleteOfflineOperations>,
): Response<PROTO.AuthDbDeleteOfflineOperationsResponse>;
