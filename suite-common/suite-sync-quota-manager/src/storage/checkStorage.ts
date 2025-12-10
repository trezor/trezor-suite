import { err, ok } from '@trezor/type-utils';

import { quotaManagerFetch } from '../quotaManagerFetch';

type AskForStorageResponse = {
    totalSpace: number;
};

type AskForStoragePublicKeyResponse = AskForStorageResponse & {
    unspentSpace: number;
};

export type CheckStorageByPublicKeyParams = {
    baseUrl: string | null;
    publicKey: string;
};

export type CheckStorageByOwnerIdParams = {
    baseUrl: string | null;
    ownerId: string;
};

/**
 * Ask quota manager for storage allowance by public key.
 * Returns also unspent space left.
 */
export const checkStorageByPublicKey = async ({
    baseUrl,
    publicKey,
}: CheckStorageByPublicKeyParams) => {
    const result = await quotaManagerFetch({
        baseUrl,
        path: '/storage/ask',
        method: 'GET',
        queryParams: { publicKey },
    });

    if (!result.ok) {
        return err(result.error);
    }

    return ok(result.value as AskForStoragePublicKeyResponse);
};

/**
 * Ask quota manager for storage allowance by owner ID.
 */
export const checkStorageByOwnerId = async ({ baseUrl, ownerId }: CheckStorageByOwnerIdParams) => {
    const result = await quotaManagerFetch({
        baseUrl,
        path: '/storage/ask',
        method: 'GET',
        queryParams: { ownerId },
    });

    if (!result.ok) {
        return err(result.error);
    }

    return ok(result.value as AskForStorageResponse);
};
