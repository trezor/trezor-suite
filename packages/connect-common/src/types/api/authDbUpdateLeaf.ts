import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbUpdateLeaf(
    params: Params<PROTO.AuthDbUpdateLeaf>,
): Response<PROTO.AuthDbUpdateLeafResponse>;
