import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { ExperimentalMethod, GetPublicKey, Params, Response } from '../params';

export declare function nostrGetPublicKey(
    params: Params<GetPublicKey & ExperimentalMethod>,
): Response<PROTO.NostrPubkey>;
