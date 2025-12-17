import { Dispatch } from '@reduxjs/toolkit';

import { SubscribeLabeling, SubscriptionStorageDep } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';

import { clearAllLabels, labelingActions } from './labelingActions';
import { EnsureStorageDep } from '../storage/createEnsureStorage';
import { createStorageIdFromDeviceStaticSessionId } from '../storage/createStorageIdFromDeviceStaticSessionId';

export type CreateSubscribeLabelingDeps = EnsureStorageDep &
    SubscriptionStorageDep & {
        dispatch: Dispatch;
    };

export const createSubscribeLabeling =
    (deps: CreateSubscribeLabelingDeps): SubscribeLabeling =>
    async ({ deviceStaticSessionId }): ReturnType<SubscribeLabeling> => {
        const storageResult = await deps.ensureStorage({ deviceStaticSessionId });

        if (!storageResult.ok) {
            return storageResult;
        }

        const storage = storageResult.value;

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        const unsubscribeWalletLabels = storage.walletLabels.subscribe(payload => {
            if (walletDescriptor !== payload.walletDescriptor) {
                console.error(
                    `Evolu: walletDescriptor mismatch exists ${walletDescriptor} !== ${payload.walletDescriptor}`,
                );

                return; // Filter out possibly corrupted data
            }

            deps.dispatch(labelingActions.setWalletLabel({ ...payload, walletDescriptor }));
        });
        const unsubscribeAccountLabels = storage.accountLabels.subscribe(payload => {
            deps.dispatch(labelingActions.setAccountLabel({ ...payload, walletDescriptor }));
        });
        const unsubscribeAddressLabels = storage.addressLabels.subscribe(payload => {
            deps.dispatch(labelingActions.setAddressLabel({ ...payload, walletDescriptor }));
        });
        const unsubscribeOutputLabels = storage.outputLabels.subscribe(payload => {
            deps.dispatch(labelingActions.setOutputLabel({ ...payload, walletDescriptor }));
        });

        deps.subscriptionStorage.add({
            name: 'labeling',
            storageId: createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId),
            unsubscribe: () => {
                unsubscribeWalletLabels();
                unsubscribeAccountLabels();
                unsubscribeAddressLabels();
                unsubscribeOutputLabels();

                // This purges the Redux state, when re-subscribed it will be re-populated from the Evolu.
                // Evolu DB is always the source of truth.
                deps.dispatch(clearAllLabels({ walletDescriptor }));
            },
        });

        return ok();
    };
