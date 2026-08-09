import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

export declare function authLabelGetState(
    params: Params<PROTO.AuthLabelGetState>,
): Response<PROTO.AuthLabelState>;
