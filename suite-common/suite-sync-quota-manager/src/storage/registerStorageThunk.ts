import { type Dispatch } from '@reduxjs/toolkit';

import { selectSelectedDevice } from '@suite-common/device';
import { err, ok } from '@trezor/type-utils';

import { quotaManagerDeviceFetched, quotaManagerFetchError } from '../quotaManagerActions';
import { quotaManagerFetch } from '../quotaManagerFetch';
import { selectQuotaManagerBaseUrl } from '../quotaManagerSelectors';

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
    totalStorageSize: number;
    unspentStorageSize: number;
};

/**
 * Thunk to register device and allocate storage in quota manager.
 */
export const registerStorageThunk =
    (params: RegisterStorageBody) => async (dispatch: Dispatch, getState: () => any) => {
        const baseUrl = selectQuotaManagerBaseUrl(getState());
        const device = selectSelectedDevice(getState());

        const path = '/storage/register';

        const result = await quotaManagerFetch({
            baseUrl,
            path,
            method: 'POST',
            body: params,
        });

        if (!result.success) {
            dispatch(quotaManagerFetchError({ error: result.error.message }));

            return err(result.error);
        }

        const response = result.payload as RegisterStorageResponse;

        if (device && device.id) {
            dispatch(
                quotaManagerDeviceFetched({
                    deviceId: device.id,
                    totalStorageSize: response.totalStorageSize,
                    unspentStorageSize: response.unspentStorageSize,
                }),
            );
        }

        return ok(response);
    };
