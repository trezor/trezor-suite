import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';

import { LABELING_PREFIX } from './labelingActions';
import { getLocalFirstStorageProvider } from '../storage/sharedObjects';

type UpdateAccountLabelThunkParams = {
    deviceStaticSessionId: string;
    accountKey: string;
    label: string | null;
};

export const updateAccountLabelThunk = createThunk<void, UpdateAccountLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateAccountLabelThunk`,
    async ({ deviceStaticSessionId, accountKey, label }, { getState }) => {
        console.log('____updateAccountLabelThunk');
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        if (device === undefined || device.localFirstStorageSecret === undefined) {
            return;
        }

        const storage = getLocalFirstStorageProvider(device.localFirstStorageSecret);

        await storage.accountLabels.update({ deviceStaticSessionId, accountKey, label });
    },
);
