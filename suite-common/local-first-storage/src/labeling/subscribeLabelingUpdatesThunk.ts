import { createThunk } from '@suite-common/redux-utils';
import { EvoluKeys } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';

import { LABELING_PREFIX, clearAllLabels, labelingActions } from './labelingActions';
import { getLocalFirstStorageProvider, subscriptionStorage } from '../storage/sharedObjects';

type SubscribeLabelingUpdatesThunkParams = {
    evoluKeys: EvoluKeys;
    walletDescriptor: WalletDescriptor;
};

export const subscribeLabelingUpdatesThunk = createThunk<
    void,
    SubscribeLabelingUpdatesThunkParams,
    void
>(
    `${LABELING_PREFIX}/subscribeLabelingUpdatesThunk`,
    ({ evoluKeys, walletDescriptor }, { dispatch }) => {
        const storage = getLocalFirstStorageProvider(evoluKeys);

        const unsubscribeWalletLabels = storage.walletLabels.subscribe(payload => {
            if (walletDescriptor !== payload.walletDescriptor) {
                return; // Filter out possibly corrupted data
            }

            dispatch(labelingActions.setWalletLabel({ ...payload, walletDescriptor }));
        });
        const unsubscribeAccountLabels = storage.accountLabels.subscribe(payload => {
            dispatch(labelingActions.setAccountLabel({ ...payload, walletDescriptor }));
        });
        const unsubscribeAddressLabels = storage.addressLabels.subscribe(payload => {
            dispatch(labelingActions.setAddressLabel({ ...payload, walletDescriptor }));
        });
        const unsubscribeOutputLabels = storage.outputLabels.subscribe(payload => {
            dispatch(labelingActions.setOutputLabel({ ...payload, walletDescriptor }));
        });

        if (subscriptionStorage[walletDescriptor] === undefined) {
            subscriptionStorage[walletDescriptor] = {};
        }

        subscriptionStorage[walletDescriptor]['labeling'] = () => {
            unsubscribeWalletLabels();
            unsubscribeAccountLabels();
            unsubscribeAddressLabels();
            unsubscribeOutputLabels();

            // This purges the Redux state, when re-subscribed it will be re-populated from the Evolu.
            // Evolu DB is always the source of truth.
            dispatch(clearAllLabels({ walletDescriptor }));
        };
    },
);
