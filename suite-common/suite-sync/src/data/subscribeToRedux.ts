import { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncTable } from '@suite-common/suite-sync-storage';
import { SubscribeData, SubscriptionStorageDep } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';

import { clearAllLabels, labelingActions, setEntity } from './labelingActions';
import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';
import { EnsureStorageDep } from '../storage/ensureStorage';

export type CreateSubscribeLabelingDeps = EnsureStorageDep &
    SubscriptionStorageDep & {
        dispatch: Dispatch;
    };

export const createReduxSubscribe =
    (deps: CreateSubscribeLabelingDeps): SubscribeData =>
    async ({ deviceStaticSessionId }) => {
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        const storage = storageResult.value;

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        const subscribeAny = <T>(table: SuiteSyncTable<T>, tableName: string) =>
            table.subscribe(entity =>
                deps.dispatch(labelingActions.setEntity({ entity, tableName })),
            );

        const unsubscribes = [
            subscribeAny(storage.accounts, 'accounts'),
            subscribeAny(storage.wallets, 'wallets'),
            subscribeAny(storage.addresses, 'addresses'),
            subscribeAny(storage.outputs, 'outputs'),
        ];

        deps.subscriptionStorage.add({
            name: 'labeling',
            storageId: createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId),
            unsubscribe: () => {
                unsubscribes.forEach(unsubscribe => unsubscribe());

                // This purges the Redux state, when re-subscribed it will be re-populated from the Evolu.
                // Evolu DB is always the source of truth.
                deps.dispatch(clearAllLabels({ walletDescriptor }));
            },
        });

        return ok();
    };
