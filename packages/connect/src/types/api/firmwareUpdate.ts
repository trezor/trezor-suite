/**
 * Sends FirmwareErase message followed by FirmwareUpdate message
 */

import type { Messages } from '@trezor/transport';
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

export declare function firmwareUpdate(params: Params<FirmwareUpdate>): Response<Messages.Success>;
export declare function firmwareUpdate(
    params: Params<FirmwareUpdateBinary>,
): Response<Messages.Success>;
