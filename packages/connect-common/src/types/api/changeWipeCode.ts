import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function changeWipeCode(
    params: Params<PROTO.ChangeWipeCode>,
): Response<PROTO.Success>;
