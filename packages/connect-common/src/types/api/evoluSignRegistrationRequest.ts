import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function evoluSignRegistrationRequest(
    params: Params<PROTO.EvoluSignRegistrationRequest>,
): Response<PROTO.EvoluRegistrationRequest>;
