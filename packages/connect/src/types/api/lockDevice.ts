import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function lockDevice(params: Params<PROTO.LockDevice>): Response<PROTO.Success>;
