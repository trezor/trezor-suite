import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { CommonParams, Response } from '../params';

export declare function showDeviceTutorial(params: CommonParams): Response<PROTO.Success>;
