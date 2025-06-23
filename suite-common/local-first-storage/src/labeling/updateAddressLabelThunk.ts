import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';

import { LABELING_PREFIX } from './labelingActions';
import { getLocalFirstStorageProvider } from '../storage/sharedObjects';

type UpdateAddressLabelThunkParams = {
    deviceStaticSessionId: string;
    address: string;
    label: string | null;
};

export const updateAddressLabelThunk = createThunk<void, UpdateAddressLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateAddressLabelThunk`,
    ({ deviceStaticSessionId, address, label }, { getState }) => {
        console.log('____updateAddressLabelThunk');
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const evoluKeys = device?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            return;
        }

        const storage = getLocalFirstStorageProvider(evoluKeys);

        storage.addressLabels.update({ address, label });
    },
);
