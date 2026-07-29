import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function wardLookup(params: Params<PROTO.WARDLookup>): Response<PROTO.WARDLookupAck>;
