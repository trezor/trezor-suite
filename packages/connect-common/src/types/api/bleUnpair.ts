import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function bleUnpair(params: Params<PROTO.BleUnpair>): Response<PROTO.Success>;
