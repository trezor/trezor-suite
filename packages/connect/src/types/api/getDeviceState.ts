import type { CommonParams, Response } from '../params';

export interface DeviceStateResponse {
    state: string;
}

export declare function getDeviceState(params?: CommonParams): Response<DeviceStateResponse>;
