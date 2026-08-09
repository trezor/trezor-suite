import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

export declare function authLabelShow(
    params: Params<PROTO.AuthLabelShow>,
): Response<PROTO.AuthLabelShowAck>;
