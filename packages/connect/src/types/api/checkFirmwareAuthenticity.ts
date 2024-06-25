import type { Response, CommonParams } from '../params';

export interface CheckFirmwareAuthenticityResponse {
    expectedFirmwareHash: string;
    actualFirmwareHash: string;
    valid: boolean;
}

export type CheckFirmwareAuthenticityParams = CommonParams & { baseUrl?: string };

export declare function checkFirmwareAuthenticity(
    params: CheckFirmwareAuthenticityParams,
): Response<CheckFirmwareAuthenticityResponse>;
