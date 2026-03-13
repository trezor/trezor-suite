import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export declare function telemetryGet(params: Params<PROTO.TelemetryGet>): Response<PROTO.Telemetry>;
