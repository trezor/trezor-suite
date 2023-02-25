import type { IntermediaryVersion } from '../firmware';
import type { Params, Response } from '../params';

export interface FirmwareUpdateBinary {
    binary: ArrayBuffer;
}

export interface FirmwareUpdate {
    version: number[];
    btcOnly?: boolean;
    baseUrl?: string;
    intermediaryVersion?: IntermediaryVersion;
}

export interface FirmwareUpdateResponse {
    hash: string;
    challenge: string;
}

export declare function firmwareUpdate(
    params: Params<FirmwareUpdate>,
): Response<FirmwareUpdateResponse>;
export declare function firmwareUpdate(
    params: Params<FirmwareUpdateBinary>,
): Response<FirmwareUpdateResponse>;
