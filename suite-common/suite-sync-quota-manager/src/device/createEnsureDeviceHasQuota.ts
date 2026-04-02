import { type Dispatch } from '@reduxjs/toolkit';

import { getPublicIdentityKeyFromDelegatedKey } from '@suite-common/delegated-identity-key';
import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { type QuotaManagerCommunicationFailedErrType } from '@suite-common/suite-sync-types';
import {
    type DelegatedIdentityKey,
    type DeviceErrorType,
    type TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import { type RegisterDeviceDep } from './createRegisterDevice';
import { QuotaManagerCommunicationFailed } from '../errors';
import { quotaManagerDeviceFetched } from '../quotaManagerActions';
import { type CheckStorageByPublicKeyDep } from './createCheckStorageByPublicKeyFetch';

export type EnsureDeviceHasQuotaParams = {
    device: TrezorDeviceWithState;
    delegatedKey: DelegatedIdentityKey;
};

export type EnsureDeviceHasQuota = (
    params: EnsureDeviceHasQuotaParams,
) => Promise<
    Result<
        void,
        QuotaManagerCommunicationFailedErrType | ProofOfDelegatedSignFailedType | DeviceErrorType
    >
>;

export type EnsureDeviceHasQuotaDeps = {
    dispatch: Dispatch;
} & CheckStorageByPublicKeyDep &
    RegisterDeviceDep;

export type EnsureDeviceHasQuotaDep = {
    ensureDeviceHasQuota: EnsureDeviceHasQuota;
};

export const createEnsureDeviceHasQuota =
    (deps: EnsureDeviceHasQuotaDeps): EnsureDeviceHasQuota =>
    async ({ device, delegatedKey }) => {
        const delegatedKeyPublic = getPublicIdentityKeyFromDelegatedKey(delegatedKey);

        const hasPublicKeyStorage = await deps.checkStorageByPublicKeyFetch({
            publicKey: delegatedKeyPublic,
        });

        if (!hasPublicKeyStorage.success) {
            return err(QuotaManagerCommunicationFailed(hasPublicKeyStorage.error));
        }

        const { status } = hasPublicKeyStorage.payload;

        switch (status) {
            case 'Allocated':
                deps.dispatch(
                    quotaManagerDeviceFetched({
                        deviceId: device.id,
                        totalStorageSize: hasPublicKeyStorage.payload.totalSpace,
                        unspentStorageSize: hasPublicKeyStorage.payload.unspentSpace,
                    }),
                );

                return ok();

            case 'NoQuota':
                return deps.registerDevice({ delegatedKey, device });

            default:
                return exhaustive(status);
        }
    };
