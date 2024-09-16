import type { CommonParams, Response } from '../params';
import type { DeviceState, StaticSessionId } from '../device';

export interface DeviceStateResponse {
    state: StaticSessionId;
    _state: DeviceState;
}

export declare function getDeviceState(params?: CommonParams): Response<DeviceStateResponse>;
