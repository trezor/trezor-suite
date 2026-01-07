import { SuiteSyncSchema } from '@suite-common/suite-sync-storage';
import {
    SubscribeSuiteSyncData,
    SubscriptionStorageDep,
    SuiteSyncListenerDep,
} from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';
import { typedObjectValues } from '@trezor/utils';

import { EnsureStorageDep } from '../storage/createEnsureStorage';
import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';

export type CreateSubscribeSuiteSyncDataDeps = EnsureStorageDep &
    SubscriptionStorageDep &
    SuiteSyncListenerDep;

export const createSubscribeSuiteSyncData =
    (deps: CreateSubscribeSuiteSyncDataDeps): SubscribeSuiteSyncData =>
    async ({ deviceStaticSessionId }): ReturnType<SubscribeSuiteSyncData> => {
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        const { data } = storageResult.value;
        const { suiteSyncListener: listener } = deps;

        // This Type-Map is here to ensure, we won't forget to subscribe new table in a type-safe way
        const unsubscribes: { [K in keyof SuiteSyncSchema]: () => void } = {
            wallets: data.wallets.subscribe({
                onChange: entity => listener.onEntityChange.wallets(deviceStaticSessionId, entity),
            }),
            accounts: data.accounts.subscribe({
                onChange: entity => listener.onEntityChange.accounts(deviceStaticSessionId, entity),
            }),
            addresses: data.addresses.subscribe({
                onChange: entity =>
                    listener.onEntityChange.addresses(deviceStaticSessionId, entity),
            }),
            outputs: data.outputs.subscribe({
                onChange: entity => listener.onEntityChange.outputs(deviceStaticSessionId, entity),
            }),
        };

        deps.subscriptionStorage.add({
            storageId: createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId),
            unsubscribe: () => {
                typedObjectValues(unsubscribes).forEach(unsubscribe => unsubscribe());
                listener.onUnsubscribe({ walletDescriptor });
            },
        });

        return ok();
    };
