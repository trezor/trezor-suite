import { Dispatch } from '@reduxjs/toolkit';

import { err, ok } from '@trezor/type-utils';

import { quotaManagerFetch } from '../quotaManagerFetchThunk';
import { selectQuotaManagerBaseUrl } from '../quotaManagerSelectors';

// TODO should only register once if in INIT mode

type RegisterStorageBody = {
    publicKey: string;
    size: number;
    proof: string;
    certificateChain: {
        deviceCert: string;
        caCert: string;
    };
    deviceModel: string;
    sessionId: string;
    challenge: string;
};

type RegisterStorageResponse = {
    storageLimit: number | null;
};

/**
 * Thunk to register device and allocate storage in quota manager.
 */
export const registerStorageThunk =
    (params: RegisterStorageBody) => async (dispatch: Dispatch, getState: () => any) => {
        const baseUrl = selectQuotaManagerBaseUrl(getState());

        const result = await quotaManagerFetch({
            baseUrl,
            path: '/storage/register',
            method: 'POST',
            body: params,
        });

        if (!result.ok) {
            return err(result.error);
        }

        return ok(result.value as RegisterStorageResponse);
    };
