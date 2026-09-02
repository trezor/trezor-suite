import { type Result, err, ok } from '@trezor/type-utils';

import {
    type QuotaManagerFetchCommunicationError,
    type QuotaManagerFetchDep,
} from '../quotaManagerFetch';

type NoQuotaResponse = {
    status: 'NoQuota';
};

type QuotaPublicKeyResponse = {
    status: 'Allocated';
    totalSpace: number;
    unspentSpace: number;
};

export type AskForStoragePublicKeyFetchResponse = NoQuotaResponse | QuotaPublicKeyResponse;

export type CheckStorageByPublicKeyFetchParams = {
    publicKey: string;
};

export type CheckStorageByPublicKeyResult = Result<
    AskForStoragePublicKeyFetchResponse,
    QuotaManagerFetchCommunicationError
>;

type CheckStorageByPublicKeyFetchDeps = QuotaManagerFetchDep;

export type CheckStorageByPublicKeyFetch = (
    params: CheckStorageByPublicKeyFetchParams,
) => Promise<CheckStorageByPublicKeyResult>;

export type CheckStorageByPublicKeyFetchDep = {
    checkStorageByPublicKeyFetch: CheckStorageByPublicKeyFetch;
};

/**
 * Ask quota manager for storage allowance by public key.
 * Returns also unspent space left.
 */
export const createCheckStorageByPublicKeyFetch =
    (deps: CheckStorageByPublicKeyFetchDeps): CheckStorageByPublicKeyFetch =>
    async ({ publicKey }) => {
        const result = await deps.quotaManagerFetch({
            path: '/storage/ask',
            method: 'POST',
            body: { publicKey },
        });

        if (!result.success) {
            return err(result.error);
        }

        return ok(result.payload as AskForStoragePublicKeyFetchResponse);
    };
