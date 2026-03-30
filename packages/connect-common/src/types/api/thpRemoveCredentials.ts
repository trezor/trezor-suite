import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { ThpCredentials } from '@trezor/protocol';

import type { CommonParams, Response } from '../params';

export declare function thpRemoveCredentials(
    params: CommonParams & { credentials?: ThpCredentials[] },
): Response<PROTO.Success>;
