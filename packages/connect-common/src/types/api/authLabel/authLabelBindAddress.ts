import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

export declare function authLabelBindAddress(
    params: Params<PROTO.AuthLabelBindAddress>,
): Response<PROTO.AuthLabelBindAddressAck>;
