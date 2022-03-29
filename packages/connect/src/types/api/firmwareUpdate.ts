import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export interface FirmwareUpdateBinary {
    binary: ArrayBuffer;
}

export interface FirmwareUpdate {
    version: number[];
    btcOnly?: boolean;
    baseUrl?: string;
    intermediary?: boolean;
}

export declare function firmwareUpdate(params: Params<FirmwareUpdate>): Response<PROTO.Success>;
export declare function firmwareUpdate(
    params: Params<FirmwareUpdateBinary>,
): Response<PROTO.Success>;
