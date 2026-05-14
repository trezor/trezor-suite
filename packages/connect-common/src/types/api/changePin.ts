import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function changePin(params: Params<PROTO.ChangePin>): Response<PROTO.Success>;
