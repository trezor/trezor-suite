import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbSetDeviceId(
    params: Params<PROTO.AuthDbSetDeviceId>,
): Response<PROTO.AuthDbSetDeviceIdResponse>;
