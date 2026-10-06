import { type Result, ok } from '@trezor/type-utils';

import {
    type QuotaManagerFetchCommunicationError,
    type QuotaManagerFetchDep,
} from '../quotaManagerFetch';

export type RegisterDeviceFetchParams = {
    deviceId: string;
    publicKey: string;
    size: number;
    rotationIndex?: number;
    proof: string;
    certificateChain: {
        deviceCert: string;
        caCert: string;
    };
    deviceModel: string;
    sessionId: string;
    challenge: string;
};

type RegisterDeviceFetchResponse = {
    totalStorageSize: number;
    unspentStorageSize: number;
};

export type RegisterDeviceFetchResult = Result<
    RegisterDeviceFetchResponse,
    QuotaManagerFetchCommunicationError
>;

export type RegisterDeviceFetchDeps = QuotaManagerFetchDep;

export type RegisterDeviceFetch = (
    params: RegisterDeviceFetchParams,
) => Promise<RegisterDeviceFetchResult>;

export type RegisterDeviceFetchDep = {
    registerDeviceFetch: RegisterDeviceFetch;
};

export const createRegisterDeviceFetch =
    (deps: RegisterDeviceFetchDeps): RegisterDeviceFetch =>
    async ({ deviceId, ...params }) => {
        const result = await deps.quotaManagerFetch({
            path: '/storage/register',
            method: 'POST',
            body: params,
        });

        if (!result.success) {
            return result;
        }

        return ok(result.payload as RegisterDeviceFetchResponse);
    };
