import type { Dispatch } from '@reduxjs/toolkit';

import { type SuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { type WalletDescriptor } from '@trezor/device-utils';
import { type Result, ok } from '@trezor/type-utils';

import {
    quotaManagerDeviceUnspentStorageFetched,
    quotaManagerOwnerFetched,
} from '../quotaManagerActions';
import {
    type QuotaManagerFetchCommunicationError,
    type QuotaManagerFetchDep,
} from '../quotaManagerFetch';

type TransferStorageBody = {
    publicKey: string;
    ownerId: SuiteSyncOwnerId;
    size: number;
    challenge: string;
    sessionId: string;
    proof: string;
};

type TransferStorageFetchResponse = {
    publicKeyUnspentSpace: number | null;
    ownerTotalSpace: number | null;
};

export type TransferStorageFetchParams = {
    params: TransferStorageBody;
    walletDescriptor: WalletDescriptor;
    deviceId?: string;
};

export type TransferStorageResult = Result<
    TransferStorageFetchResponse,
    QuotaManagerFetchCommunicationError
>;

export type TransferStorageFetchDeps = {
    dispatch: Dispatch;
} & QuotaManagerFetchDep;

export type TransferStorageFetch = (
    params: TransferStorageFetchParams,
) => Promise<TransferStorageResult>;

export type TransferStorageFetchDep = {
    transferStorageFetch: TransferStorageFetch;
};

/**
 * This service transfers storage from a device to an owner.
 *
 * Can be used to increase the quota of the owner by transferring unspent storage from the device.
 */
export const createTransferStorageFetch =
    (deps: TransferStorageFetchDeps): TransferStorageFetch =>
    async ({ params, walletDescriptor, deviceId }) => {
        const result = await deps.quotaManagerFetch({
            path: '/storage/add',
            method: 'POST',
            body: params,
        });

        if (!result.success) {
            return result;
        }

        const response = result.payload as TransferStorageFetchResponse;

        // Todo: shall be in separate service
        deps.dispatch(
            quotaManagerOwnerFetched({
                walletDescriptor,
                totalSpace: response.ownerTotalSpace ?? 0,
            }),
        );

        if (deviceId !== undefined && response.publicKeyUnspentSpace !== null) {
            deps.dispatch(
                quotaManagerDeviceUnspentStorageFetched({
                    deviceId,
                    unspentStorageSize: response.publicKeyUnspentSpace,
                }),
            );
        }

        return ok(response);
    };
