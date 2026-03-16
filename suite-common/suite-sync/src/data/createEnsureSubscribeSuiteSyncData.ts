import { type SuiteSyncSchema } from '@suite-common/suite-sync-storage';
import {
    type SubscribeSuiteSyncData,
    type SubscriptionStorageDep,
    type SuiteSyncListenerDep,
} from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';
import { typedObjectValues } from '@trezor/utils';

import { type EnsureStorageDep } from '../storage/createEnsureStorage';
import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';

export type CreateSubscribeSuiteSyncDataDeps = EnsureStorageDep &
    SubscriptionStorageDep &
    SuiteSyncListenerDep;

export const createEnsureSubscribeSuiteSyncData =
    (deps: CreateSubscribeSuiteSyncDataDeps): SubscribeSuiteSyncData =>
    async ({ deviceStaticSessionId, isWriteMode }): ReturnType<SubscribeSuiteSyncData> => {
        const storageResult = await deps.ensureStorage({
            deviceStaticSessionId,
            isWriteMode,
        });

        if (!storageResult.success) {
            return storageResult;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);

        if (deps.subscriptionStorage.has(storageId)) {
            return storageResult;
        }

        const { data } = storageResult.payload;
        const { suiteSyncListener: listener } = deps;

        // This Type-Map is here to ensure, we won't forget to subscribe new table in a type-safe way
        const unsubscribes: { [K in keyof SuiteSyncSchema]: () => void } = {
            wallets: data.wallets.subscribe({
                onChange: entities =>
                    listener.onEntityChange.wallets(deviceStaticSessionId, entities),
            }),
            accounts: data.accounts.subscribe({
                onChange: entities =>
                    listener.onEntityChange.accounts(deviceStaticSessionId, entities),
            }),
            addresses: data.addresses.subscribe({
                onChange: entities =>
                    listener.onEntityChange.addresses(deviceStaticSessionId, entities),
            }),
            outputs: data.outputs.subscribe({
                onChange: entities =>
                    listener.onEntityChange.outputs(deviceStaticSessionId, entities),
            }),
        };

        deps.subscriptionStorage.add({
            storageId,
            unsubscribe: () => {
                typedObjectValues(unsubscribes).forEach(unsubscribe => unsubscribe());
                listener.onUnsubscribe({ walletDescriptor });
            },
        });

        return ok(storageResult.payload);
    };
