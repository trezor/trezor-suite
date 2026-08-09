import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

export declare function authLabelChange(
    params: Params<PROTO.AuthLabelChange>,
): Response<PROTO.AuthLabelChangeAck>;
