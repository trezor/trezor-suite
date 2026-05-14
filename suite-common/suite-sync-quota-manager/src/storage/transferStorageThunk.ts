import type { Dispatch } from '@reduxjs/toolkit';

import { type SuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { type WalletDescriptor } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';

import {
    quotaManagerDeviceUnspentStorageFetched,
    quotaManagerFetchError,
    quotaManagerOwnerFetched,
} from '../quotaManagerActions';
import { quotaManagerFetch } from '../quotaManagerFetch';
import { selectQuotaManagerBaseUrl } from '../quotaManagerSelectors';

type TransferStorageBody = {
    publicKey: string;
    ownerId: SuiteSyncOwnerId;
    size: number;
    challenge: string;
    sessionId: string;
    proof: string;
};

type TransferStorageResponse = {
    publicKeyUnspentSpace: number | null;
    ownerTotalSpace: number | null;
};

type TransferStorageThunkParams = {
    params: TransferStorageBody;
    walletDescriptor: WalletDescriptor;
    deviceId?: string;
};

export const transferStorageThunk =
    ({ params, walletDescriptor, deviceId }: TransferStorageThunkParams) =>
    async (dispatch: Dispatch, getState: () => any) => {
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
                walletDescriptor,
                totalSpace: response.ownerTotalSpace ?? 0,
            }),
        );

        if (deviceId !== undefined && response.publicKeyUnspentSpace !== null) {
            dispatch(
                quotaManagerDeviceUnspentStorageFetched({
                    deviceId,
                    unspentStorageSize: response.publicKeyUnspentSpace,
                }),
            );
        }

        return ok(response);
    };
