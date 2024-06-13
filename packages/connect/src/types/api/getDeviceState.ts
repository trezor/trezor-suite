import type { CommonParams, Response } from '../params';
import type { DeviceState } from '../device';

export interface DeviceStateResponse {
    state: string;
    _state: DeviceState;
}

export declare function getDeviceState(params?: CommonParams): Response<DeviceStateResponse>;
