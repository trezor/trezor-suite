import { Dispatch } from '@reduxjs/toolkit';

import type { XOR } from '@trezor/type-utils';
import { err, ok } from '@trezor/type-utils';

import { quotaManagerFetchThunk } from '../quotaManagerFetchThunk';

type PublicKeyOrOwnerId = XOR<{ publicKey: string }, { ownerId: string }>;

type AskForStorageResponse = {
    totalSpace: number;
};

type AskForStoragePublicKeyResponse = AskForStorageResponse & {
    unspentSpace: number;
};

/**
 * Thunk to ask quota manager for storage allowance.
 * Returns also unspent space left when public key is provided.
 */
export const askForStorageThunk =
    (queryParam: PublicKeyOrOwnerId) => async (dispatch: Dispatch) => {
        const result = await dispatch(
            quotaManagerFetchThunk({
                path: '/storage/ask',
                method: 'GET',
                queryParams: queryParam,
            }),
        );

        if (!result.ok) {
            return err(result.error);
        }

        return ok(result.data as AskForStorageResponse | AskForStoragePublicKeyResponse);
    };
