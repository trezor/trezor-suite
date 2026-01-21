import type { DeviceState } from '../device';
import type { CommonParams, Response } from '../params';

export interface DeviceStateResponse {
    state: DeviceState;
}

export declare function getDeviceState(params?: CommonParams): Response<DeviceStateResponse>;
