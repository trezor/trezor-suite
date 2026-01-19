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
        method: 'POST',
        body: { publicKey },
    });

    if (!result.success) {
        return err(result.error);
    }

    return ok(result.payload as AskForStoragePublicKeyResponse);
};

/**
 * Ask quota manager for storage allowance by owner ID.
 */
export const checkStorageByOwnerId = async ({ baseUrl, ownerId }: CheckStorageByOwnerIdParams) => {
    const result = await quotaManagerFetch({
        baseUrl,
        path: '/storage/ask',
        method: 'POST',
        body: { ownerId },
    });

    if (!result.success) {
        return err(result.error);
    }

    return ok(result.payload as AskForStorageResponse);
};
