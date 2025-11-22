import { createThunk } from '@suite-common/redux-utils';
import { getLocalFirstStorageProvider } from '@suite-common/suite-sync-storage';
import { selectDevices } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';

import { LABELING_PREFIX } from './labelingActions';

type UpdateAddressLabelThunkParams = {
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label: string | null;
};

export const updateAddressLabelThunk = createThunk<void, UpdateAddressLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateAddressLabelThunk`,
    ({ deviceStaticSessionId, address, label }, { getState }) => {
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const evoluKeys = device?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            console.error(
                'Evolu: [updateAddressLabelThunk] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        const storage = getLocalFirstStorageProvider(evoluKeys);

        storage.addressLabels.update({ address, label });
    },
);
