import type { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncOwnerId } from '@suite-common/suite-types';
import { err, ok } from '@trezor/type-utils';

import { quotaManagerFetchError, quotaManagerOwnerFetched } from '../quotaManagerActions';
import { quotaManagerFetch } from '../quotaManagerFetch';
import { selectQuotaManagerBaseUrl } from '../quotaManagerSelectors';
import { hashSuiteSyncOwnerId } from '../util/hasSuiteSyncOwnerId';

type TransferStorageBody = {
    publicKey: string;
    ownerId: SuiteSyncOwnerId;
    size: number;
    challenge: string;
    sessionId: string;
    proof: string;
};

type TransferStorageResponse = {
    storageLimit: number | null;
};

export const transferStorageThunk =
    (params: TransferStorageBody) => async (dispatch: Dispatch, getState: () => any) => {
        const baseUrl = selectQuotaManagerBaseUrl(getState());

        const result = await quotaManagerFetch({
            baseUrl,
            path: '/storage/add',
            method: 'POST',
            body: params,
        });

        if (!result.success) {
            dispatch(quotaManagerFetchError({ error: result.error.message }));

            return err(result.error);
        }

        const response = result.payload as TransferStorageResponse;

        dispatch(
            quotaManagerOwnerFetched({
                ownerIdHash: hashSuiteSyncOwnerId(params.ownerId),
                totalSpace: response.storageLimit ?? 0,
            }),
        );

        return ok(response);
    };
