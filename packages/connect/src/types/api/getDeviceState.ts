import type { DeviceState, StaticSessionId } from '../device';
import type { CommonParams, Response } from '../params';

export interface DeviceStateResponse {
    state: StaticSessionId;
    _state: DeviceState;
}

export declare function getDeviceState(params?: CommonParams): Response<DeviceStateResponse>;
