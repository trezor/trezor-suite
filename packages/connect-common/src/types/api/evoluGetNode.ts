import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function evoluGetNode(params: Params<PROTO.EvoluGetNode>): Response<PROTO.EvoluNode>;
