import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function authDbLookup(
    params: Params<PROTO.AuthDbLookup>,
): Response<PROTO.AuthDbLookupResponse>;
