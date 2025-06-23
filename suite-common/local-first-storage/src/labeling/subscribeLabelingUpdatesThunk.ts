import { createThunk } from '@suite-common/redux-utils';

import { LABELING_PREFIX, clearAllLabels, labelingActions } from './labelingActions';
import { getLocalFirstStorageProvider, subscriptionStorage } from '../storage/sharedObjects';

type SubscribeLabelingUpdatesThunkParams = {
    localFirstStorageSecret: string;
    deviceStaticSessionId: string;
};

export const subscribeLabelingUpdatesThunk = createThunk<
    void,
    SubscribeLabelingUpdatesThunkParams,
    void
>(
    `${LABELING_PREFIX}/subscribeLabelingUpdatesThunk`,
    ({ localFirstStorageSecret, deviceStaticSessionId }, { dispatch }) => {
        const storage = getLocalFirstStorageProvider(localFirstStorageSecret);

        const unsubscribeWalletLabels = storage.walletLabels.subscribe(payload => {
            dispatch(labelingActions.setWalletLabel(payload));
        });
        const unsubscribeAccountLabels = storage.accountLabels.subscribe(payload => {
            dispatch(labelingActions.setAccountLabel(payload));
        });
        const unsubscribeAddressLabels = storage.addressLabels.subscribe(payload => {
            dispatch(labelingActions.setAddressLabel(payload));
        });
        const unsubscribeOutputLabels = storage.outputLabels.subscribe(payload => {
            dispatch(labelingActions.setOutputLabel(payload));
        });

        if (subscriptionStorage[deviceStaticSessionId] === undefined) {
            subscriptionStorage[deviceStaticSessionId] = {};
        }

        subscriptionStorage[deviceStaticSessionId]['labeling'] = () => {
            unsubscribeWalletLabels();
            unsubscribeAccountLabels();
            unsubscribeAddressLabels();
            unsubscribeOutputLabels();

            // This purges the Redux state, when re-subscribed it will be re-populated from the Evolu.
            // Evolu DB is always the source of truth.
            dispatch(clearAllLabels());
        };
    },
);
