import { type Result, err, ok } from '@trezor/type-utils';

import {
    type QuotaManagerFetchCommunicationError,
    type QuotaManagerFetchDep,
} from '../quotaManagerFetch';

type NoQuotaResponse = {
    status: 'NoQuota';
};

type QuotaOwnerResponse = {
    status: 'Allocated';
    totalSpace: number;
};

export type AskForStorageResponse = NoQuotaResponse | QuotaOwnerResponse;

export type CheckStorageByOwnerIdParams = {
    ownerId: string;
};

export type CheckStorageByOwnerIdResult = Result<
    AskForStorageResponse,
    QuotaManagerFetchCommunicationError
>;

type CheckStorageByOwnerIdFetchDeps = QuotaManagerFetchDep;

export type CheckStorageByOwnerIdFetch = (
    params: CheckStorageByOwnerIdParams,
) => Promise<CheckStorageByOwnerIdResult>;

export type CheckStorageByOwnerIdFetchDep = {
    checkStorageByOwnerIdFetch: CheckStorageByOwnerIdFetch;
};

/**
 * Ask quota manager for storage allowance by owner ID.
 */
export const createCheckStorageByOwnerIdFetch =
    (deps: CheckStorageByOwnerIdFetchDeps): CheckStorageByOwnerIdFetch =>
    async ({ ownerId }) => {
        const result = await deps.quotaManagerFetch({
            path: '/storage/ask',
            method: 'POST',
            body: { ownerId },
        });

        if (!result.success) {
            return err(result.error);
        }

        return ok(result.payload as AskForStorageResponse);
    };
