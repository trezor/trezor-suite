import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbApprove(
    params: Params<PROTO.AuthDbApprove>,
): Response<PROTO.AuthDbApproveResponse>;
