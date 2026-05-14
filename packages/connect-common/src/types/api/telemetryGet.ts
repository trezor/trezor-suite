import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function telemetryGet(params: Params<PROTO.TelemetryGet>): Response<PROTO.Telemetry>;
