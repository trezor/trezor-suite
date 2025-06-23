import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';

import { LABELING_PREFIX } from './labelingActions';
import { getLocalFirstStorageProvider } from '../storage/sharedObjects';

type UpdateWalletLabelThunkParams = {
    deviceStaticSessionId: string;
    label: string | null;
};

export const updateWalletLabelThunk = createThunk<void, UpdateWalletLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateWalletLabelThunk`,
    ({ deviceStaticSessionId, label }, { getState }) => {
        console.log('_____updateWalletLabelThunk');
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const evoluKeys = device?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            console.log('_____no evoluKeys keys');

            return;
        }

        const storage = getLocalFirstStorageProvider(evoluKeys);

        storage.walletLabels.update({ deviceStaticSessionId, label });
    },
);
