import type { Response, CommonParams } from '../params';

export interface CheckFirmwareAuthenticityResponse {
    expectedFirmwareHash: string;
    actualFirmwareHash: string;
    valid: boolean;
}

export declare function checkFirmwareAuthenticity(
    params: CommonParams,
): Response<CheckFirmwareAuthenticityResponse>;
