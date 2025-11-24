import { createThunk } from '@suite-common/redux-utils';
import { getSuiteSyncStorageProvider } from '@suite-common/suite-sync-storage';
import { selectDevices } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

import { LABELING_PREFIX } from './labelingActions';

type UpdateWalletLabelThunkParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export const updateWalletLabelThunk = createThunk<void, UpdateWalletLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateWalletLabelThunk`,
    ({ deviceStaticSessionId, label }, { getState }) => {
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = device?.suiteSyncOwner;

        if (owner === undefined) {
            console.error(
                'Evolu: [updateWalletLabelThunk] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        const storage = getSuiteSyncStorageProvider(owner);

        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        storage.walletLabels.update({ walletDescriptor, label });
    },
);
