import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function applyFlags(params: Params<PROTO.ApplyFlags>): Response<PROTO.Success>;
