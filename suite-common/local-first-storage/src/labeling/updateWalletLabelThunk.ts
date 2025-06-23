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
    ({ deviceStaticSessionId, label }, { getState, rejectWithValue }) => {
        console.log('_____updateWalletLabelThunk');
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        if (device === undefined || device.localFirstStorageSecret === undefined) {
            console.log(`device undefined / no secret`);

            return rejectWithValue(`device undefined / no secret`);
        }

        const storage = getLocalFirstStorageProvider(device.localFirstStorageSecret);

        storage.walletLabels.update({ deviceStaticSessionId, label });
    },
);
