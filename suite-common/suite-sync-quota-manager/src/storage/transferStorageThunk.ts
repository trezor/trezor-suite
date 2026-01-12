import { err, ok } from '@trezor/type-utils';

import { quotaManagerFetch } from '../quotaManagerFetch';
import { selectQuotaManagerBaseUrl } from '../quotaManagerSelectors';

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

export const transferStorageThunk =
    (params: TransferStorageBody) => async (getState: () => any) => {
        const baseUrl = selectQuotaManagerBaseUrl(getState());

        const result = await quotaManagerFetch({
            baseUrl,
            path: '/storage/add',
            method: 'POST',
            body: params,
        });

        if (!result.success) {
            return err(result.error);
        }

        // assign space / storage limit to ownerId in follow up PR

        return ok(result.payload as TransferStorageResponse);
    };
