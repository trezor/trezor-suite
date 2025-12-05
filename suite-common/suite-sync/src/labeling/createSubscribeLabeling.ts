import { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncOwner } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';

import { clearAllLabels, labelingActions } from './labelingActions';
import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';
import { SubscriptionStorageDep } from '../storage/subscriptionStorage';

type SubscribeLabelingParams = {
    owner: SuiteSyncOwner;
    walletDescriptor: WalletDescriptor;
};

export type SubscribeLabeling = (params: SubscribeLabelingParams) => void;

export type CreateSubscribeLabelingDeps = SuiteSyncStorageRepositoryDep &
    SubscriptionStorageDep & {
        dispatch: Dispatch;
    };

export const createSubscribeLabeling =
    (deps: CreateSubscribeLabelingDeps): SubscribeLabeling =>
    ({ owner, walletDescriptor }) => {
        const storage = deps.suiteSyncStorageRepository.get(owner);

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
            ownerId: owner.ownerId,
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
    };
