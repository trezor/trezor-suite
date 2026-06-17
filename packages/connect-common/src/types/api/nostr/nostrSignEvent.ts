import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { NostrSignEvent } from './common';
import type { ExperimentalMethod, Params, Response } from '../../params';

export declare function nostrSignEvent(
    params: Params<NostrSignEvent & ExperimentalMethod>,
): Response<PROTO.NostrEventSignature>;
