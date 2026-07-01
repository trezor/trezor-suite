import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbClearRoot(
    params: Params<PROTO.AuthDbClearRoot>,
): Response<PROTO.AuthDbClearRootResponse>;
