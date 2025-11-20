import { Dispatch } from '@reduxjs/toolkit';

import { err, ok } from '@trezor/type-utils';

import { quotaManagerFetchThunk } from '../quotaManagerFetchThunk';

type TransferStorageBody = {
    proof: string;
    size: number;
    timestamp: number;
    publicKey: string;
    ownerId: string;
};

type TransferStorageResponse = {
    storageLimit: number | null;
};

export const transferStorageThunk = (params: TransferStorageBody) => async (dispatch: Dispatch) => {
    const result = await dispatch(
        quotaManagerFetchThunk({
            path: '/storage/add',
            method: 'POST',
            body: params,
        }),
    );

    if (!result.ok) {
        return err(result.error);
    }

    return ok(result.data as TransferStorageResponse);
};
