import { createThunk } from '@suite-common/redux-utils';
import { selectDevices } from '@suite-common/wallet-core';
import { parseAccountKey } from '@suite-common/wallet-utils';

import { LABELING_PREFIX } from './labelingActions';
import { getLocalFirstStorageProvider } from '../storage/sharedObjects';

type UpdateAccountLabelThunkParams = {
    deviceStaticSessionId: string;
    accountKey: string;
    label: string | null;
};

export const updateAccountLabelThunk = createThunk<void, UpdateAccountLabelThunkParams, void>(
    `${LABELING_PREFIX}/updateAccountLabelThunk`,
    ({ deviceStaticSessionId, accountKey, label }, { getState }) => {
        console.log('____updateAccountLabelThunk');
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === deviceStaticSessionId,
        );

        const evoluKeys = device?.localFirstStorageSecret?.evoluKeys;

        if (evoluKeys === undefined) {
            return;
        }

        const storage = getLocalFirstStorageProvider(evoluKeys);

        const { accountDescriptor, networkSymbol } = parseAccountKey(accountKey);

        storage.accountLabels.update({ accountDescriptor, networkSymbol, label });
    },
);
