import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { ExperimentalMethod, Params, Response } from '../params';
import type { NostrSignEvent } from './nostr';

export declare function nostrSignEvent(
    params: Params<NostrSignEvent & ExperimentalMethod>,
): Response<PROTO.NostrEventSignature>;
