import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

import { LABELING_PREFIX } from './labelingActions';
import { getLocalFirstStorageProvider } from '../storage/sharedObjects';

type UpdateWalletLabelThunkParams = {
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export const updateWalletLabelThunk = createThunk<void, UpdateWalletLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateWalletLabelThunk`,
    ({ deviceStaticSessionId, label }, { getState }) => {
        console.log('_____updateWalletLabelThunk', deviceStaticSessionId);
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        console.log('_____updateWalletLabelThunk::device', device);

        const evoluKeys = device?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            return;
        }

        try {
            const storage = getLocalFirstStorageProvider(evoluKeys);

            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

            storage.walletLabels.update({ walletDescriptor, label });
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
);
