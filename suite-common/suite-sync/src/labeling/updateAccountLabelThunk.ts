import { createThunk } from '@suite-common/redux-utils';
import { getSuiteSyncStorageProvider } from '@suite-common/suite-sync-storage';
import { selectDevices } from '@suite-common/wallet-core';
import { parseAccountKey } from '@suite-common/wallet-utils';

import { LABELING_PREFIX } from './labelingActions';

type UpdateAccountLabelThunkParams = {
    deviceStaticSessionId: string;
    accountKey: string;
    label: string | null;
};

export const updateAccountLabelThunk = createThunk<void, UpdateAccountLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateAccountLabelThunk`,
    ({ deviceStaticSessionId, accountKey, label }, { getState }) => {
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const owner = device?.suiteSyncOwner;

        if (owner === undefined) {
            console.error(
                'Evolu: [updateAccountLabelThunk] no keys found on the selected device',
                deviceStaticSessionId,
            );

            return;
        }

        const storage = getSuiteSyncStorageProvider(owner);

        const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);

        storage.accountLabels.update({ accountDescriptor, networkSymbol, label });
    },
);
