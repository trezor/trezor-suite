import { Dispatch } from '@reduxjs/toolkit';

import { err, ok } from '@trezor/type-utils';

import { quotaManagerFetchThunk } from '../quotaManagerFetchThunk';

type SyncBody = {
    ownerId: string;
};

// TODO: endpoint is WIP
type SyncResponse = {
    quota: number;
};

export const syncThunk = (params: SyncBody) => async (dispatch: Dispatch) => {
    const result = await dispatch(
        quotaManagerFetchThunk({
            path: '/sync',
            method: 'POST',
            body: params,
        }),
    );

    if (!result.ok) {
        return err(result.error);
    }

    return ok(result.data as SyncResponse);
};
