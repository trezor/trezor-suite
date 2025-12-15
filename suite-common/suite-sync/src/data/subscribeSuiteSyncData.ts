import { SuiteSyncSchema } from '@suite-common/suite-sync-storage';
import {
    SubscribeSuiteSyncData,
    SubscriptionStorageDep,
    SuiteSyncListenerDep,
} from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';
import { typedObjectValues } from '@trezor/utils';

import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';
import { EnsureStorageDep } from '../storage/ensureStorage';

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
            wallets: data.wallets.subscribe({ onChange: listener.onEntityChange.wallets }),
            accounts: data.accounts.subscribe({ onChange: listener.onEntityChange.accounts }),
            addresses: data.addresses.subscribe({ onChange: listener.onEntityChange.addresses }),
            outputs: data.outputs.subscribe({ onChange: listener.onEntityChange.outputs }),
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
